import React, { useEffect, useRef, useState } from 'react';
import { Coin, Agent } from '../types';
import { Info, HelpCircle, Network } from 'lucide-react';

interface EcosystemMapProps {
  coins: Coin[];
  agents: Agent[];
  selectedCoinId: string;
  onSelectCoin: (coinId: string) => void;
  lastTriggeredEvent: any;
}

interface PhysicsNode {
  id: string;
  name: string;
  symbol: string;
  type: 'coin' | 'agent';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  targetX?: number;
  targetY?: number;
  marketCap?: number;
  change24h?: number;
  pnl?: number;
  activeCoinId?: string | null;
}

const EcosystemMap = React.memo(function EcosystemMap({
  coins,
  agents,
  selectedCoinId,
  onSelectCoin,
  lastTriggeredEvent,
}: EcosystemMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const nodesRef = useRef<PhysicsNode[]>([]);
  const hoverNodeRef = useRef<PhysicsNode | null>(null);
  const activeLinksRef = useRef<{ id: string; start: string; end: string; alpha: number; maxAlpha: number }[]>([]);
  const lastEventIdRef = useRef<string>('');

  const [hoveredInfo, setHoveredInfo] = useState<{ name: string; type: string; stat: string } | null>(null);

  // Initialize nodes once or on list size change
  useEffect(() => {
    if (nodesRef.current.length > 0 && nodesRef.current.filter(n => n.type === 'coin').length === coins.length) {
      // Just update dynamic properties of existing nodes
      nodesRef.current.forEach(node => {
        if (node.type === 'coin') {
          const coin = coins.find(c => c.id === node.id);
          if (coin) {
            node.marketCap = coin.marketCap;
            node.change24h = coin.change24h;
            node.radius = Math.max(10, Math.min(32, Math.log10(coin.marketCap) * 4 - 6));
            node.color = coin.change24h >= 0 ? '#00FF41' : '#FF1744';
          }
        } else {
          const agent = agents.find(a => a.id === node.id);
          if (agent) {
            node.pnl = agent.pnl;
            node.activeCoinId = agent.activeCoinId;
          }
        }
      });
      return;
    }

    // Set up positions
    const width = containerRef.current?.clientWidth || 600;
    const height = containerRef.current?.clientHeight || 400;

    const newNodes: PhysicsNode[] = [];

    // Place coins in a clean ring pattern in the center
    coins.forEach((coin, idx) => {
      const angle = (idx / coins.length) * Math.PI * 2;
      const radiusDist = Math.min(width, height) * 0.38;
      const cx = width / 2 + Math.cos(angle) * radiusDist;
      const cy = height / 2 + Math.sin(angle) * radiusDist;

      newNodes.push({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        type: 'coin',
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        radius: Math.max(12, Math.min(32, Math.log10(coin.marketCap) * 4 - 6)),
        color: coin.change24h >= 0 ? '#00FF41' : '#FF1744',
        marketCap: coin.marketCap,
        change24h: coin.change24h,
      });
    });

    // Place agents dispersed randomly — avoid coin ring area
    agents.forEach((agent) => {
      const midX = width / 2;
      const midY = height / 2;
      const safeDist = Math.min(width, height) * 0.42;
      // Place agents outside the coin ring
      let ax, ay;
      do {
        ax = 30 + Math.random() * (width - 60);
        ay = 30 + Math.random() * (height - 60);
      } while (Math.hypot(ax - midX, ay - midY) < safeDist);
      
      newNodes.push({
        id: agent.id,
        name: agent.name,
        symbol: agent.id.toUpperCase(),
        type: 'agent',
        x: ax,
        y: ay,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: 5,
        color: agent.color,
        pnl: agent.pnl,
        activeCoinId: agent.activeCoinId,
      });
    });

    nodesRef.current = newNodes;
  }, [coins, agents]);

  // Handle Event Triggers (Flash Lines on Trades)
  useEffect(() => {
    if (!lastTriggeredEvent || lastTriggeredEvent.id === lastEventIdRef.current) return;
    lastEventIdRef.current = lastTriggeredEvent.id;

    // If it's a buy/sell, create an active bright pulse connection!
    if (lastTriggeredEvent.type === 'BUY' || lastTriggeredEvent.type === 'SELL') {
      const coin = coins.find(c => c.symbol === lastTriggeredEvent.symbol);
      const agent = lastTriggeredEvent.agentId;

      if (coin && agent) {
        // Add custom pulse animation
        activeLinksRef.current.push({
          id: `${agent}_${coin.id}_${Date.now()}`,
          start: agent,
          end: coin.id,
          alpha: 1.0,
          maxAlpha: 1.0,
        });
      }
    }
  }, [lastTriggeredEvent, coins]);

  // Main Canvas Loop (Physics + Rendering)
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      canvas.width = (rect?.width || 600) * window.devicePixelRatio;
      canvas.height = (rect?.height || 400) * window.devicePixelRatio;
      canvas.style.width = `${rect?.width || 600}px`;
      canvas.style.height = `${rect?.height || 400}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse coordinates for hover interactions
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found: PhysicsNode | null = null;
      for (const node of nodesRef.current) {
        const dx = node.x - mouseX;
        const dy = node.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < node.radius + 6) {
          found = node;
          break;
        }
      }

      hoverNodeRef.current = found;
      if (found) {
        if (found.type === 'coin') {
          setHoveredInfo({
            name: found.name,
            type: 'Asset Token',
            stat: `Cap: $${found.marketCap?.toLocaleString()} | 24h: ${found.change24h?.toFixed(2)}%`,
          });
        } else {
          setHoveredInfo({
            name: found.name,
            type: 'Autonomous Agent',
            stat: `PnL: ${found.pnl?.toFixed(1)}% | Status: ${agents.find(a => a.id === found.id)?.status || 'IDLE'}`,
          });
        }
      } else {
        setHoveredInfo(null);
      }
    };

    const handleMouseClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      for (const node of nodesRef.current) {
        if (node.type === 'coin') {
          const dx = node.x - mouseX;
          const dy = node.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < node.radius + 10) {
            onSelectCoin(node.id);
            break;
          }
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleMouseClick);

    // Frame Tick
    const render = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw Subtle Cross Grid Background
      ctx.strokeStyle = 'rgba(22, 31, 48, 0.15)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw horizontal & vertical crosshairs centering selected coin if any
      const selectedNode = nodesRef.current.find(n => n.id === selectedCoinId);
      if (selectedNode) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([4, 4]);
        
        ctx.beginPath();
        ctx.moveTo(selectedNode.x, 0);
        ctx.lineTo(selectedNode.x, h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, selectedNode.y);
        ctx.lineTo(w, selectedNode.y);
        ctx.stroke();
        
        ctx.setLineDash([]);
      }

      // 2. Physics updates for agents
      nodesRef.current.forEach(node => {
        if (node.type === 'agent') {
          // If agent has activeCoinId, experience gravitational pull towards that coin node!
          if (node.activeCoinId) {
            const coinNode = nodesRef.current.find(n => n.id === node.activeCoinId);
            if (coinNode) {
              const dx = coinNode.x - node.x;
              const dy = coinNode.y - node.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 30) {
                // Acceleration vector
                node.vx += (dx / dist) * 0.12;
                node.vy += (dy / dist) * 0.12;
              }
            }
          }

          // Random ambient drift forces — smooth, minimal
          node.vx += (Math.random() - 0.5) * 0.06;
          node.vy += (Math.random() - 0.5) * 0.06;

          // Drag/damping — high inertia for smooth motion
          node.vx *= 0.96;
          node.vy *= 0.96;

          // Update position
          node.x += node.vx;
          node.y += node.vy;

          // Border collision
          const margin = 20;
          if (node.x < margin) { node.x = margin; node.vx *= -1; }
          if (node.x > w - margin) { node.x = w - margin; node.vx *= -1; }
          if (node.y < margin) { node.y = margin; node.vy *= -1; }
          if (node.y > h - margin) { node.y = h - margin; node.vy *= -1; }
        } else {
          // Coins also have gentle ambient floating oscillation to look alive
          const coinIdx = coins.findIndex(c => c.id === node.id);
          const time = Date.now() * 0.001;
          node.x += Math.sin(time + coinIdx) * 0.08;
          node.y += Math.cos(time + coinIdx * 1.5) * 0.08;
        }
      });

      // 3. Render Neural Links
      // A. Draw default continuous faint lines between agents and their trading coin
      ctx.lineWidth = 0.5;
      nodesRef.current.forEach(node => {
        if (node.type === 'agent' && node.activeCoinId) {
          const coinNode = nodesRef.current.find(n => n.id === node.activeCoinId);
          if (coinNode) {
            ctx.strokeStyle = `rgba(30, 41, 59, 0.35)`;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(coinNode.x, coinNode.y);
            ctx.stroke();
          }
        }
      });

      // B. Update and draw electric trade pulses
      activeLinksRef.current = activeLinksRef.current.filter(link => {
        const startNode = nodesRef.current.find(n => n.id === link.start);
        const endNode = nodesRef.current.find(n => n.id === link.end);

        if (startNode && endNode) {
          link.alpha -= 0.015; // smooth fade
          if (link.alpha <= 0) return false;

          // Glowing light line
          ctx.strokeStyle = `rgba(0, 240, 255, ${link.alpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(startNode.x, startNode.y);
          ctx.lineTo(endNode.x, endNode.y);
          ctx.stroke();

          // Particle moving along the line
          const progress = 1 - link.alpha; // 0 to 1
          const px = startNode.x + (endNode.x - startNode.x) * progress;
          const py = startNode.y + (endNode.y - startNode.y) * progress;
          
          ctx.fillStyle = '#00F0FF';
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();

          return true;
        }
        return false;
      });

      // 4. Draw Coin Nodes
      nodesRef.current.forEach(node => {
        if (node.type === 'coin') {
          const isSelected = node.id === selectedCoinId;
          const isHovered = hoverNodeRef.current?.id === node.id;

          // Outer halo
          ctx.fillStyle = node.color === '#00FF41' ? 'rgba(0, 255, 65, 0.05)' : 'rgba(255, 23, 68, 0.05)';
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + (isSelected ? 10 : 6), 0, Math.PI * 2);
          ctx.fill();

          // Selection double ring
          if (isSelected) {
            ctx.strokeStyle = '#00F0FF';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2);
            ctx.stroke();

            // Tiny focus coordinates label
            ctx.fillStyle = '#00F0FF';
            ctx.font = '8px var(--font-mono)';
            ctx.fillText(`LOC: ${Math.round(node.x)},${Math.round(node.y)}`, node.x - 22, node.y - node.radius - 12);
          }

          // Node body
          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fill();

          // Inner dark core
          ctx.fillStyle = '#050608';
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius - 2, 0, Math.PI * 2);
          ctx.fill();

          // Label
          ctx.fillStyle = isSelected ? '#00F0FF' : isHovered ? '#ffffff' : '#D1D1D1';
          ctx.font = 'bold 9px var(--font-mono)';
          ctx.textAlign = 'center';
          ctx.fillText(`$${node.symbol}`, node.x, node.y + 3);

          // Change badge below
          if (node.change24h !== undefined) {
            ctx.fillStyle = node.change24h >= 0 ? '#00FF41' : '#FF1744';
            ctx.font = '8px var(--font-mono)';
            const pct = Math.abs(node.change24h);
            const pctStr = pct >= 1 ? pct.toFixed(1) : pct.toFixed(Math.max(2, Math.ceil(-Math.log10(pct)) + 2));
            ctx.fillText(`${node.change24h >= 0 ? '+' : '-'}${pctStr}%`, node.x, node.y + node.radius + 10);
          }
        }
      });

      // 5. Draw Agent Particles
      nodesRef.current.forEach(node => {
        if (node.type === 'agent') {
          const isHovered = hoverNodeRef.current?.id === node.id;
          const isTradingThis = node.activeCoinId === selectedCoinId;

          // Outer pulse if trading current coin
          if (isTradingThis) {
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 0.5;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Body
          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, isHovered ? 6 : 4, 0, Math.PI * 2);
          ctx.fill();

          // Draw agent ID initials above
          ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(148, 163, 184, 0.7)';
          ctx.font = '7px var(--font-mono)';
          ctx.textAlign = 'center';
          ctx.fillText(node.symbol.slice(4) || node.symbol, node.x, node.y - 7);
        }
      });

      // 6. Draw glowing HUD metrics overlay
      ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
      ctx.font = '8px var(--font-mono)';
      ctx.textAlign = 'left';
      ctx.fillText(`AGENTS ONLINE: ${agents.length}`, 15, 20);
      ctx.fillText(`COIN SATELLITES: ${coins.length}`, 15, 30);
      ctx.fillText(`NEURAL LINX: ${activeLinksRef.current.length + agents.filter(a => a.activeCoinId).length}`, 15, 40);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleMouseClick);
    };
  }, [coins, agents, selectedCoinId, onSelectCoin]);

  return (
    <div className="flex flex-col h-full border border-dim bg-black/40">
      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-dim bg-black/50 px-4 py-2">
        <div className="flex items-center space-x-2">
          <Network size={14} className="text-cyan-neon" />
          <span className="font-display text-sm font-semibold tracking-wider text-slate-200 uppercase">
            Ecosystem Neural Map
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[9px] font-mono text-white/40">
          <span>COINS = CENTRALS</span>
          <span>•</span>
          <span>AGENTS = FLYERS</span>
        </div>
      </div>

      {/* Interactive HUD Map */}
      <div ref={containerRef} className="relative flex-1 bg-glow overflow-hidden min-h-[300px]">
        <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

        {/* Dynamic Tooltip inside canvas container */}
        {hoveredInfo && (
          <div className="absolute top-3 right-3 border border-dim bg-black/90 p-2 text-left font-mono pointer-events-none">
            <div className="text-[10px] font-bold text-slate-100">{hoveredInfo.name}</div>
            <div className="text-[8px] text-cyan-neon uppercase mt-0.5">{hoveredInfo.type}</div>
            <div className="text-[9px] text-slate-400 border-t border-dim mt-1 pt-1">
              {hoveredInfo.stat}
            </div>
          </div>
        )}

        {/* Small Instruction overlay */}
        <div className="absolute bottom-2 right-2 border border-dim bg-black/80 px-2 py-1 flex items-center gap-1 font-mono text-[8px] text-white/50 select-text">
          <HelpCircle size={9} />
          <span>Click coins to focus details &amp; charts</span>
        </div>
      </div>
    </div>
  );
});

export default EcosystemMap;
