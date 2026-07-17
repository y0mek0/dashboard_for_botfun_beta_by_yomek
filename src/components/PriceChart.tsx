import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Coin } from '../types';
import { Activity } from 'lucide-react';

interface PriceChartProps {
  selectedCoin: Coin;
}

const PriceChart = React.memo(function PriceChart({ selectedCoin }: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  
  const prevPricesRef = useRef<number[]>([]);
  const targetPricesRef = useRef<number[]>([]);
  const animStartRef = useRef<number>(0);
  
  // Hover state in ref for rAF sync + state for tooltip
  const hoverIdxRef = useRef<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Main continuous render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect?.width || 600;
      const h = rect?.height || 300;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      
      const now = performance.now();
      const elapsed = animStartRef.current ? now - animStartRef.current : 999;
      const duration = 350;
      const t = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 3);

      const target = targetPricesRef.current;
      const prev = prevPricesRef.current;
      const data = prev.length ? prev.map((p, i) => p + (target[i] - p) * ease) : target;

      const len = data.length;
      if (len === 0) { rafRef.current = requestAnimationFrame(render); return; }

      const pl = 12, pr = 50, pt = 20, pb = 16;
      const cw = w - pl - pr, ch = h - pt - pb;
      const priceH = ch * 0.65;
      const volH = ch * 0.14;
      const pressH = ch * 0.17;
      const gap = ch * 0.02;
      const priceY = pt, volY = priceY + priceH + gap;
      const pressY = volY + volH + gap + pressH / 2;

      let maxP = Math.max(...data) * 1.05;
      let minP = Math.min(...data) * 0.95;
      if (maxP === minP) { maxP += 1; minP -= 1; }

      // Clear
      ctx.fillStyle = '#0a0a10';
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 3]);
      for (let i = 0; i <= 4; i++) {
        const y = priceY + (priceH / 4) * i;
        ctx.beginPath(); ctx.moveTo(pl, y); ctx.lineTo(w - pr, y); ctx.stroke();
      }
      ctx.setLineDash([]);

      // Y labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      for (let i = 0; i <= 4; i++) {
        const y = priceY + (priceH / 4) * i;
        ctx.fillText(`$${(maxP - ((maxP - minP) / 4) * i).toFixed(6)}`, w - pr + 2, y + 3);
      }

      // Price line points
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < len; i++) {
        points.push({ x: pl + (cw / Math.max(1, len - 1)) * i, y: priceY + priceH - ((data[i] - minP) / (maxP - minP)) * priceH });
      }

      // Area fill
      const grad = ctx.createLinearGradient(0, priceY, 0, priceY + priceH);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.06)');
      grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(points[0].x, priceY + priceH);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[len - 1].x, priceY + priceH);
      ctx.closePath(); ctx.fill();

      // Price line stroke
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < len; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();

      // Volume bars
      const barW = Math.max(2, (cw / Math.max(1, len - 1)) * 0.6);
      const volMax = selectedCoin.volume24h * 1.5;
      for (let i = 0; i < len; i++) {
        const x = pl + (cw / Math.max(1, len - 1)) * i - barW / 2;
        const bh = Math.min(volH, Math.max(1, ((selectedCoin.volume24h / len) * 0.3) / volMax * volH * 20));
        ctx.fillStyle = i === hoverIdxRef.current ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(x, volY + volH - bh, barW, bh);
      }

      // Price bar baseline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath(); ctx.moveTo(pl, pressY); ctx.lineTo(w - pr, pressY); ctx.stroke();
      for (let i = 0; i < len; i++) {
        const x = pl + (cw / Math.max(1, len - 1)) * i - barW / 2;
        const diff = i === 0 ? 0 : data[i] - data[i - 1];
        const bias = diff >= 0 ? 1 : -1;
        ctx.fillStyle = diff >= 0 ? 'rgba(0, 255, 65, 0.3)' : 'rgba(255, 23, 68, 0.3)';
        const barH = Math.min(pressH / 2, Math.abs(diff) * 200);
        ctx.fillRect(x, diff >= 0 ? pressY - barH : pressY, barW, barH);
      }

      // === CROSSHAIR ===
      const hi = hoverIdxRef.current;
      if (hi !== null && hi < len && points[hi]) {
        const hx = points[hi].x;
        const hy = points[hi].y;
        
        // Vertical line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(hx, pt); ctx.lineTo(hx, h - pb); ctx.stroke();
        ctx.setLineDash([]);

        // Horizontal line
        ctx.beginPath(); ctx.moveTo(pl, hy); ctx.lineTo(w - pr, hy); ctx.stroke();

        // Dot at intersection
        ctx.fillStyle = '#00F0FF';
        ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(hx, hy, 4, 0, Math.PI * 2); ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // When coin data changes, set new target for interpolation
  useEffect(() => {
    const newData = [...selectedCoin.priceHistory];
    const prevLen = targetPricesRef.current.length;
    prevPricesRef.current = prevLen === newData.length ? [...targetPricesRef.current] : new Array(newData.length).fill(newData[0]);
    targetPricesRef.current = newData;
    animStartRef.current = performance.now();
  }, [selectedCoin.priceHistory]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const len = selectedCoin.priceHistory.length;
    if (len < 2) return;
    const cw = (canvas.width / window.devicePixelRatio) - 12 - 50;
    const idx = Math.round(((x - 12) / cw) * (len - 1));
    if (idx >= 0 && idx < len) {
      hoverIdxRef.current = idx;
      setHoverIdx(idx);
      setHoverPos({ x: e.clientX, y: e.clientY });
    }
  }, [selectedCoin.priceHistory.length]);

  const handleMouseLeave = useCallback(() => {
    hoverIdxRef.current = null;
    setHoverIdx(null);
    setHoverPos(null);
  }, []);

  const hasPriceHistory = selectedCoin.priceHistory.length > 1;

  // Tooltip data
  const tooltipData = hoverIdx !== null ? selectedCoin.priceHistory[hoverIdx] : null;
  const prevPrice = hoverIdx !== null && hoverIdx > 0 ? selectedCoin.priceHistory[hoverIdx - 1] : null;
  const tipChange = tooltipData && prevPrice && prevPrice !== 0 ? ((tooltipData - prevPrice) / prevPrice * 100) : 0;

  return (
    <div className="flex flex-col h-full border border-dim bg-black/40">
      <div className="flex items-center justify-between border-b border-dim bg-black/50 px-4 py-2">
        <div className="flex items-center space-x-2">
          <Activity size={14} className="text-cyan-neon" />
          <span className="font-display text-sm font-semibold tracking-wider text-slate-100 uppercase">
            {selectedCoin.name} ({selectedCoin.symbol})
          </span>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono">
          <span className="text-white/40">PRICE:<span className="ml-1 text-white/90 font-semibold">${selectedCoin.price.toFixed(6)}</span></span>
          <span className="text-white/40">MCAP:<span className="ml-1 text-white/80">${selectedCoin.marketCap.toLocaleString()}</span></span>
        </div>
      </div>
      <div ref={containerRef} className="relative flex-1 bg-black/30 min-h-[220px]">
        <canvas 
          ref={canvasRef} 
          onMouseMove={handleMouseMove} 
          onMouseLeave={handleMouseLeave} 
          className="block w-full h-full cursor-crosshair" 
        />

        {/* Tooltip */}
        {hoverIdx !== null && hoverPos && tooltipData && (
          <div 
            className="absolute pointer-events-none z-20 bg-black/90 border border-cyan-neon/30 px-2 py-1.5 text-xs font-mono shadow-lg"
            style={{ 
              left: hoverPos.x > window.innerWidth / 2 ? 'auto' : `${hoverPos.x + 10}px`,
              right: hoverPos.x > window.innerWidth / 2 ? `${window.innerWidth - hoverPos.x + 10}px` : 'auto',
              top: `${hoverPos.y - 60}px`,
            }}
          >
            <div className="flex items-center gap-2 border-b border-white/10 pb-1 mb-1">
              <span className="text-cyan-neon font-bold">${tooltipData.toFixed(8)}</span>
              <span className={`font-bold ${tipChange >= 0 ? 'text-green-neon' : 'text-red-neon'}`}>
                {tipChange >= 0 ? '+' : ''}{tipChange.toFixed(2)}%
              </span>
            </div>
            <div className="text-white/40">
              <span className="block">Point {hoverIdx + 1}/{selectedCoin.priceHistory.length}</span>
              <span className="block">{new Date().toLocaleDateString()} ({hoverIdx}h ago)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default PriceChart;
