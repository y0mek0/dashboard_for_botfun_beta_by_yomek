import React, { useState } from 'react';
import { Coin } from '../types';
import { Grid, Layers } from 'lucide-react';

interface ActivityHeatmapProps {
  coins: Coin[];
  selectedCoinId: string;
  onSelectCoin: (id: string) => void;
}

const ActivityHeatmap = React.memo(function ActivityHeatmap({ coins, selectedCoinId, onSelectCoin }: ActivityHeatmapProps) {
  const [hoverCell, setHoverCell] = useState<{ coinId: string; hour: number; val: number } | null>(null);

  // Hours: 0 to 23
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Max activity for cell opacity normalization
  const maxActivity = Math.max(...coins.flatMap(c => c.activity24h), 100);

  // Map intensity value to styling color
  const getCellColor = (val: number, isSelectedCoin: boolean) => {
    const ratio = val / maxActivity;
    // We'll use either a green gradient or a cyan gradient
    if (isSelectedCoin) {
      if (ratio > 0.8) return { bg: 'bg-cyan-neon', text: 'text-black' };
      if (ratio > 0.5) return { bg: 'bg-cyan-neon/80', text: 'text-white' };
      if (ratio > 0.25) return { bg: 'bg-cyan-neon/50', text: 'text-slate-200' };
      if (ratio > 0.1) return { bg: 'bg-cyan-neon/25', text: 'text-slate-400' };
      return { bg: 'bg-cyan-neon/10 border border-cyan-neon/5', text: 'text-slate-500' };
    } else {
      if (ratio > 0.8) return { bg: 'bg-green-neon', text: 'text-black' };
      if (ratio > 0.5) return { bg: 'bg-green-neon/80', text: 'text-white' };
      if (ratio > 0.25) return { bg: 'bg-green-neon/50', text: 'text-slate-200' };
      if (ratio > 0.1) return { bg: 'bg-green-neon/25', text: 'text-slate-400' };
      return { bg: 'bg-green-neon/10 border border-green-neon/5', text: 'text-slate-500' };
    }
  };

  return (
    <div className="flex flex-col h-full border border-dim bg-black/40 text-xs font-mono select-text">
      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-dim bg-black/50 px-4 py-2">
        <div className="flex items-center space-x-2">
          <Grid size={14} className="text-cyan-neon" />
          <span className="font-display text-sm font-semibold tracking-wider text-slate-200 uppercase">
            Hourly Activity (24h)
          </span>
        </div>
        <span className="text-[10px] text-white/50 uppercase">
          Vertical: Assets • Horizontal: Hour (UTC)
        </span>
      </div>

      {/* Grid container with relative overlay */}
      <div className="flex-1 p-2 flex flex-col justify-between min-h-[160px] relative">
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[440px] flex flex-col gap-[2px]">
            {/* Hour Headers */}
            <div className="flex items-center gap-[2px] mb-1">
              <span className="w-16 text-[10px] text-white/40 font-bold uppercase truncate">
                Asset
              </span>
              {hours.map((h) => (
                <span
                  key={h}
                  className="flex-1 text-center text-[10px] text-white/40 font-bold hover:text-slate-300 transition-colors"
                >
                  {h.toString().padStart(2, '0')}
                </span>
              ))}
            </div>

            {/* Coin Grid rows */}
            {coins.slice(0, 10).map((coin) => {
              const isSelected = coin.id === selectedCoinId;

              return (
                <div key={coin.id} className="flex items-center gap-[2px]">
                  {/* Coin label trigger */}
                  <span
                    onClick={() => onSelectCoin(coin.id)}
                    className={`w-16 text-xs font-bold py-1 px-1 truncate cursor-pointer interactive border ${
                      isSelected
                        ? 'bg-cyan-neon/10 border-cyan-neon/40 text-cyan-neon'
                        : 'bg-black/40 border-transparent text-white/60 hover:text-white hover:bg-black/60'
                    }`}
                  >
                    ${coin.symbol}
                  </span>

                  {/* Heat cells */}
                  {hours.map((hr) => {
                    const activityValue = coin.activity24h[hr] || 0;
                    const style = getCellColor(activityValue, isSelected);

                    return (
                      <div
                        key={hr}
                        onMouseEnter={() => setHoverCell({ coinId: coin.id, hour: hr, val: activityValue })}
                        onMouseLeave={() => setHoverCell(null)}
                        onClick={() => onSelectCoin(coin.id)}
                        className={`flex-1 aspect-square min-h-[10px] transition-[background,box-shadow] duration-200 cursor-pointer ${style.bg} hover:ring-1 hover:ring-white active:scale-90`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Cell popover status */}
        <div className="h-6 border-t border-dim mt-2 pt-2 flex items-center justify-between text-[10px] text-white/40">
          {hoverCell ? (
            <div className="flex items-center space-x-2 text-white/80">
              <Layers size={9} className="text-cyan-neon" />
              <span>COIN: <span className="font-bold text-cyan-neon">${coins.find(c => c.id === hoverCell.coinId)?.symbol}</span></span>
              <span>•</span>
              <span>TIME SLOT: <span className="font-bold">{hoverCell.hour.toString().padStart(2, '0')}:00 UTC</span></span>
              <span>•</span>
              <span>VELOCITY: <span className="font-bold text-green-neon">{hoverCell.val} tx/h</span></span>
            </div>
          ) : (
            <span className="text-white/30 text-[10px]">HOVER FOR TRANSACTION VELOCITIES</span>
          )}
          
          <div className="flex items-center space-x-1">
            <span className="text-[10px]">LOW</span>
            <span className="w-1.5 h-1.5 bg-green-neon/10 border border-green-neon/5" />
            <span className="w-1.5 h-1.5 bg-green-neon/25" />
            <span className="w-1.5 h-1.5 bg-green-neon/50" />
            <span className="w-1.5 h-1.5 bg-green-neon" />
            <span className="text-[10px]">HIGH</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ActivityHeatmap;
