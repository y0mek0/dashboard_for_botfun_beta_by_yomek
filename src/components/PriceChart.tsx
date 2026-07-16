import React, { useEffect, useRef, useState } from 'react';
import { Coin } from '../types';
import { Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PriceChartProps {
  selectedCoin: Coin;
}

const PriceChart = React.memo(function PriceChart({ selectedCoin }: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  
  // Store interpolated values for smooth animation
  const prevPricesRef = useRef<number[]>([]);
  const targetPricesRef = useRef<number[]>([]);
  const animStartRef = useRef<number>(0);
  const dirtyRef = useRef(true);

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

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
      
      // Smooth interpolation params
      const now = performance.now();
      const elapsed = animStartRef.current ? now - animStartRef.current : 999;
      const duration = 350;
      const t = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic

      // Interpolate prices
      const target = targetPricesRef.current;
      const prev = prevPricesRef.current;
      const data = prev.length ? prev.map((p, i) => p + (target[i] - p) * ease) : target;
      
      // Schedule next frame until animation completes
      if (t < 1) {
        dirtyRef.current = true;
      }

      const len = data.length;
      if (len === 0) { rafRef.current = requestAnimationFrame(render); return; }

      // Layout
      const pl = 15, pr = 55, pt = 25, pb = 20;
      const cw = w - pl - pr, ch = h - pt - pb;
      const priceH = ch * 0.7;
      const volH = ch * 0.12;
      const pressH = ch * 0.16;
      const gap = ch * 0.01;
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
      ctx.font = '9px var(--font-mono)';
      ctx.textAlign = 'left';
      for (let i = 0; i <= 4; i++) {
        const y = priceY + (priceH / 4) * i;
        ctx.fillText(`$${(maxP - ((maxP - minP) / 4) * i).toFixed(4)}`, w - pr + 2, y + 3);
      }

      // Price line
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < len; i++) {
        points.push({ x: pl + (cw / (len - 1)) * i, y: priceY + priceH - ((data[i] - minP) / (maxP - minP)) * priceH });
      }

      const grad = ctx.createLinearGradient(0, priceY, 0, priceY + priceH);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.06)');
      grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(points[0].x, priceY + priceH);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[len - 1].x, priceY + priceH);
      ctx.closePath(); ctx.fill();

      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < len; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();

      // Volume bars
      const barW = Math.max(2, (cw / len) * 0.6);
      const volMax = selectedCoin.volume24h * 1.5;
      for (let i = 0; i < len; i++) {
        const x = pl + (cw / (len - 1)) * i - barW / 2;
        const bh = Math.min(volH, Math.max(1, ((selectedCoin.volume24h / len) * (Math.sin(i / 2) * 0.3 + 0.7)) / volMax * volH * 20));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x, volY + volH - bh, barW, bh);
      }

      // Pressure
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath(); ctx.moveTo(pl, pressY); ctx.lineTo(w - pr, pressY); ctx.stroke();
      for (let i = 0; i < len; i++) {
        const x = pl + (cw / (len - 1)) * i - barW / 2;
        const diff = i === 0 ? 0 : data[i] - data[i - 1];
        const bias = diff >= 0 ? 0.6 : 0.4;
        ctx.fillStyle = 'rgba(0, 255, 65, 0.3)';
        ctx.fillRect(x, pressY - Math.min(pressH / 2, (bias * 40 + 5) * (pressH / 100)), barW, Math.min(pressH / 2, (bias * 40 + 5) * (pressH / 100)));
        ctx.fillStyle = 'rgba(255, 23, 68, 0.3)';
        ctx.fillRect(x, pressY, barW, Math.min(pressH / 2, ((1 - bias) * 40 + 5) * (pressH / 100)));
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
    prevPricesRef.current = targetPricesRef.current.length ? [...targetPricesRef.current] : [...selectedCoin.priceHistory];
    targetPricesRef.current = [...selectedCoin.priceHistory];
    animStartRef.current = performance.now();
    dirtyRef.current = true;
  }, [selectedCoin.priceHistory]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const len = selectedCoin.priceHistory.length;
    const idx = Math.round(((x - 15) / ((canvas.width / window.devicePixelRatio) - 70)) * (len - 1));
    if (idx >= 0 && idx < len) setHoverIdx(idx);
  };

  const isUp = selectedCoin.change24h >= 0;

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
          <span className="text-white/40">PRICE:<span className={`ml-1 font-semibold ${isUp ? 'text-green-neon' : 'text-red-neon'}`}>${selectedCoin.price.toFixed(4)}</span></span>
          <span className="text-white/40">24H:<span className={`ml-1 font-semibold ${isUp ? 'text-green-neon' : 'text-red-neon'}`}>{isUp ? '+' : ''}{selectedCoin.change24h}%</span></span>
          <span className="text-white/40">MCAP:<span className="ml-1 text-white/80">${selectedCoin.marketCap.toLocaleString()}</span></span>
        </div>
      </div>
      <div ref={containerRef} className="relative flex-1 bg-black/30 min-h-[220px]">
        <canvas ref={canvasRef} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIdx(null)} className="block w-full h-full cursor-crosshair" />
      </div>
    </div>
  );
});

export default PriceChart;
