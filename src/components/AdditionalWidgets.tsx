import { useEffect, useState } from 'react';
import { Coin } from '../types';
import { BarChart2, Waves, Activity, Disc, RefreshCw } from 'lucide-react';

interface AdditionalWidgetsProps {
  coins: Coin[];
  selectedCoin: Coin;
}

export default function AdditionalWidgets({ coins, selectedCoin }: AdditionalWidgetsProps) {
  const [fluidPhase, setFluidPhase] = useState(0);

  // Animate fluid wave phase
  useEffect(() => {
    const handle = setInterval(() => {
      setFluidPhase((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(handle);
  }, []);

  // Compute buy pressure percentage based on selected coin's holders/PnL
  const activeBuyPressure = Math.round(selectedCoin.bondingProgress * 0.4 + 40 + Math.sin(fluidPhase / 10) * 3);

  // Sparkline generator for Matrix
  const renderMicroSparkline = (history: number[], isUp: boolean) => {
    if (history.length === 0) return null;
    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min || 1;

    const w = 70;
    const h = 18;
    const pts = history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * w;
      const y = h - ((val - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return (
      <svg width={w} height={h} className="overflow-visible">
        <polyline
          fill="none"
          stroke={isUp ? '#00FF41' : '#FF1744'}
          strokeWidth="1.2"
          points={pts}
        />
      </svg>
    );
  };

  // Stacked Ridgeline waves generator (3 waves overlapping)
  const renderRidgelineChart = () => {
    const w = 180;
    const h = 50;
    const slices = 20;

    // We'll draw 4 overlapping ridges
    const ridgeRows = coins.slice(0, 4);

    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        {ridgeRows.map((coin, rIdx) => {
          const yBase = 12 + rIdx * 9; // Stack offset
          const amplitude = 10;
          const frequency = 0.25;

          const points: string[] = [];
          for (let i = 0; i <= slices; i++) {
            const x = (i / slices) * w;
            // Wave height is a function of price fluctuations
            const offset = (fluidPhase / 15) + (rIdx * 3);
            const sinVal = Math.sin(i * frequency + offset) * Math.cos(i * 0.1 + offset);
            const y = yBase - Math.max(1, (sinVal + 1) * 0.5 * amplitude * (coin.change24h >= 0 ? 1.2 : 0.6));
            points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
          }

          // Complete path to close bottom
          const closedPoints = [`0,${yBase}`, ...points, `${w},${yBase}`].join(' ');

          const strokeColors = ['#00F0FF', '#00FF41', '#a855f7', '#FF1744'];
          const fillColors = ['rgba(0, 240, 255, 0.12)', 'rgba(0, 255, 65, 0.1)', 'rgba(168, 85, 247, 0.08)', 'rgba(255, 23, 68, 0.06)'];

          return (
            <g key={coin.id}>
              {/* Closed ridge fill */}
              <polygon points={closedPoints} fill={fillColors[rIdx % fillColors.length]} />
              {/* Ridge peak line */}
              <polyline
                points={points.join(' ')}
                fill="none"
                stroke={strokeColors[rIdx % strokeColors.length]}
                strokeWidth="0.8"
              />
            </g>
          );
        })}
      </svg>
    );
  };

  // Radial Volume spoke generator
  const renderRadialVolume = () => {
    const c = 26; // Center x, y
    const numSpokes = 16;
    const spokes = [];

    for (let i = 0; i < numSpokes; i++) {
      const angle = (i / numSpokes) * Math.PI * 2;
      // Spoke length fluctuates based on selected coin statistics
      const pulse = Math.sin(fluidPhase / 6 + i) * 3 + 8;
      const length = Math.max(3, pulse + (selectedCoin.volume24h % (i + 1)) * 0.002);
      const limitLen = Math.min(22, length);

      const x1 = c + 4 * Math.cos(angle);
      const y1 = c + 4 * Math.sin(angle);
      const x2 = c + limitLen * Math.cos(angle);
      const y2 = c + limitLen * Math.sin(angle);

      spokes.push({ x1, y1, x2, y2, angle });
    }

    return (
      <svg width="52" height="52" className="overflow-visible">
        {/* Center core */}
        <circle cx={c} cy={c} r="3" fill="#00F0FF" className="animate-pulse" />
        {/* Spokes */}
        {spokes.map((s, idx) => (
          <line
            key={idx}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={idx % 3 === 0 ? '#00F0FF' : 'rgba(148, 163, 184, 0.4)'}
            strokeWidth="0.8"
          />
        ))}
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
      {/* 1. Sparkline Matrix (Grid of small spark graphs) */}
      <div className="panel relative p-2 flex flex-col justify-between font-mono text-xs select-text">
        {/* HUD Corner Indicators */}
        <div className="corner-marker corner-tl" />
        <div className="corner-marker corner-tr" />
        <div className="corner-marker corner-bl" />
        <div className="corner-marker corner-br" />

        <div className="flex items-center space-x-1 border-b border-dim pb-1 mb-1 bg-black/20 px-1 py-0.5">
          <Activity size={10} className="text-cyan-neon" />
          <span className="font-display text-[9px] font-semibold text-slate-300 uppercase">
            Sparkline Asset Matrix
          </span>
        </div>

        <div className="flex flex-col gap-[6px] flex-1 justify-center px-1">
          {coins.slice(0, 3).map((coin) => {
            const isUp = coin.change24h >= 0;
            return (
              <div key={coin.id} className="flex items-center justify-between gap-1 py-0.5">
                <span className="text-[9px] font-bold text-slate-200">${coin.symbol}</span>
                {renderMicroSparkline(coin.priceHistory.slice(-15), isUp)}
                <span className={`text-[8px] font-bold ${isUp ? 'text-green-neon' : 'text-red-neon'}`}>
                  {isUp ? '+' : ''}
                  {coin.change24h.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Liquid Gauge (Buy/Sell pressure waves) */}
      <div className="panel relative p-2 flex flex-col justify-between font-mono text-xs select-text">
        {/* HUD Corner Indicators */}
        <div className="corner-marker corner-tl" />
        <div className="corner-marker corner-tr" />
        <div className="corner-marker corner-bl" />
        <div className="corner-marker corner-br" />

        <div className="flex items-center space-x-1 border-b border-dim pb-1 mb-1 bg-black/20 px-1 py-0.5">
          <Waves size={10} className="text-cyan-neon" />
          <span className="font-display text-[9px] font-semibold text-slate-300 uppercase">
            Fluid Liquidity Pressure
          </span>
        </div>

        <div className="flex items-center justify-center py-1 flex-1 gap-3">
          {/* Wave Container Circle */}
          <div className="w-12 h-12 rounded-full border border-dim bg-black relative overflow-hidden flex items-center justify-center">
            {/* Wave fluid fill */}
            <div
              className="absolute left-0 right-0 bottom-0 bg-green-neon/20 transition-all duration-300 border-t border-green-neon/40"
              style={{
                height: `${activeBuyPressure}%`,
                transform: `rotate(${Math.sin(fluidPhase / 10) * 8}deg)`,
              }}
            />
            
            {/* Readout label centered */}
            <span className="relative font-bold text-[10px] text-green-neon font-mono">
              {activeBuyPressure}%
            </span>
          </div>

          <div className="flex flex-col text-[8px] text-white/50 gap-0.5">
            <span className="text-green-neon font-bold">BUY FLOW PRES</span>
            <span>THRESHOLD METRICS</span>
            <span>VELOCITY: FLUIDIC</span>
          </div>
        </div>
      </div>

      {/* 3. Ridgeline Volume stack */}
      <div className="panel relative p-2 flex flex-col justify-between font-mono text-xs select-text">
        {/* HUD Corner Indicators */}
        <div className="corner-marker corner-tl" />
        <div className="corner-marker corner-tr" />
        <div className="corner-marker corner-bl" />
        <div className="corner-marker corner-br" />

        <div className="flex items-center justify-between border-b border-dim pb-1 mb-1 bg-black/20 px-1 py-0.5">
          <div className="flex items-center space-x-1">
            <BarChart2 size={10} className="text-cyan-neon" />
            <span className="font-display text-[9px] font-semibold text-slate-300 uppercase">
              Ridgeline Volume Profiles
            </span>
          </div>
          <span className="text-[7px] text-white/30">4-GRID</span>
        </div>

        <div className="flex-1 flex items-center justify-center py-1">
          {renderRidgelineChart()}
        </div>
      </div>
    </div>
  );
}
