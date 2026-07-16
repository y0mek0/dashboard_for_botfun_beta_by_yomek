import { useState } from 'react';
import { LaunchItem } from '../types';
import { Rocket } from 'lucide-react';

interface LaunchTimelineProps {
  launches: LaunchItem[];
  onSelectCoin: (id: string) => void;
}

export default function LaunchTimeline({ launches, onSelectCoin }: LaunchTimelineProps) {
  const [hoveredLaunch, setHoveredLaunch] = useState<LaunchItem | null>(null);

  const chronologicalLaunches = [...launches].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const getSuccessColor = (score: number) => {
    if (score >= 70) return { dot: 'fill-cyan-neon stroke-white/50', text: 'text-cyan-neon', border: 'border-cyan-neon/40', bg: 'bg-cyan-neon/10' };
    if (score >= 45) return { dot: 'fill-green-neon stroke-white/50', text: 'text-green-neon', border: 'border-green-neon/40', bg: 'bg-green-neon/10' };
    if (score >= 25) return { dot: 'fill-yellow-400 stroke-white/50', text: 'text-yellow-400', border: 'border-yellow-400/40', bg: 'bg-yellow-400/10' };
    return { dot: 'fill-red-neon stroke-white/50', text: 'text-red-neon', border: 'border-red-neon/40', bg: 'bg-red-neon/10' };
  };

  return (
    <div className="border border-dim bg-black/40 text-xs font-mono select-text">
      {/* Compact single-line layout */}
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Label */}
        <div className="flex items-center gap-2 shrink-0">
          <Rocket size={13} className="text-cyan-neon" />
          <span className="font-display text-[11px] font-semibold tracking-wider text-slate-200 uppercase">
            Launches
          </span>
        </div>

        {/* Timeline line + dots */}
        <div className="flex-1 relative h-7 flex items-center">
          {/* Line */}
          <div className="absolute left-0 right-0 h-px bg-white/10" />
          
          {/* Dots */}
          <div className="relative z-10 w-full flex items-center justify-between px-1">
            {chronologicalLaunches.map((item, idx) => {
              const radius = Math.max(2.5, Math.min(7, Math.log10(item.marketCap) * 1.2 - 1));
              const style = getSuccessColor(item.successScore);

              return (
                <div
                  key={item.id}
                  className="relative flex flex-col items-center cursor-pointer group interactive"
                  onMouseEnter={() => setHoveredLaunch(item)}
                  onMouseLeave={() => setHoveredLaunch(null)}
                  onClick={() => onSelectCoin(item.symbol.toLowerCase())}
                >
                  {/* Pulse ring for high-success */}
                  {item.successScore >= 70 && (
                    <div className={`absolute w-3 h-3 rounded-full animate-ping ${style.bg} opacity-40`}
                         style={{ animationDuration: '2s' }} />
                  )}
                  {/* Dot */}
                  <div className={`w-2 h-2 rounded-full ${style.dot} ${style.border} border z-10`} />
                  {/* Symbol below */}
                  <span className={`text-[9px] leading-none mt-0.5 ${style.text} font-bold`}>
                    ${item.symbol}
                  </span>

                  {/* Hover tooltip */}
                  {hoveredLaunch?.id === item.id && (
                    <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 border ${style.border} ${style.bg} px-2 py-1 text-left pointer-events-none whitespace-nowrap`}>
                      <div className="text-[10px] font-bold text-slate-100">${item.symbol}</div>
                      <div className="text-[9px] text-white/40">{item.name} · {item.time}</div>
                      <div className="text-[9px] text-white/50">MCAP: ${item.marketCap.toLocaleString()} · {item.successScore}%</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Count badge */}
        <span className="text-[9px] text-white/30 shrink-0">{chronologicalLaunches.length} new</span>
      </div>
    </div>
  );
}
