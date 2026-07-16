import React from 'react';
import { Coin, Holder } from '../types';
import { LayoutGrid, AlertCircle } from 'lucide-react';

interface HolderTreemapProps {
  selectedCoin: Coin;
}

const HolderTreemap = React.memo(function HolderTreemap({ selectedCoin }: HolderTreemapProps) {
  const holders = selectedCoin.holders;

  // Simple layout grid calculation for Treemap partition
  // Arrange boxes horizontally or vertically based on relative sizes
  // We'll calculate a partition. Total share is 100%.
  // We sort them descending so largest are rendered first.
  const sortedHolders = [...holders].sort((a, b) => b.supplyShare - a.supplyShare);

  const getPnlColor = (pnl: number) => {
    if (pnl >= 40) return { bg: 'bg-green-neon/20', border: 'border-green-neon/50', text: 'text-green-neon' };
    if (pnl >= 0) return { bg: 'bg-green-neon/10', border: 'border-green-neon/30', text: 'text-green-neon/80' };
    if (pnl >= -15) return { bg: 'bg-white/5', border: 'border-white/20', text: 'text-white/60' };
    return { bg: 'bg-red-neon/20', border: 'border-red-neon/50', text: 'text-red-neon' };
  };

  return (
    <div className="flex flex-col h-full border border-dim bg-black/40 text-xs font-mono select-text">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-dim bg-black/50 px-4 py-2">
        <div className="flex items-center space-x-2">
          <LayoutGrid size={14} className="text-cyan-neon" />
          <span className="font-display text-sm font-semibold tracking-wider text-slate-200 uppercase">
            Supply Share
          </span>
        </div>
        <span className="text-[10px] text-white/50 uppercase font-mono">
          {selectedCoin.symbol} COIN CAP
        </span>
      </div>

      {/* Treemap visual partition workspace */}
      <div className={'flex-1 p-2 flex flex-col gap-[6px] min-h-[160px]'}>
        {/* Top 2 large holders split horizontally, rest below */}
        <div className={'flex-1 grid grid-cols-12 gap-[6px]'}>
          {/* Main Whale 1 */}
          {sortedHolders[0] && (() => {
            const style = getPnlColor(sortedHolders[0].pnl);
            return (
              <div
                className={`col-span-7 border ${style.border} ${style.bg} p-2 flex flex-col justify-between transition-[background,border-color] duration-200`}
                title={`${sortedHolders[0].name} holds ${sortedHolders[0].supplyShare}% of supply`}
              >
                <div>
                  <span className="text-xs text-slate-200 font-bold block truncate">
                    {sortedHolders[0].name}
                  </span>
                  <span className="text-[10px] text-slate-500 block uppercase">
                    Major Stake
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-semibold text-sm text-slate-100 font-mono">
                    {sortedHolders[0].supplyShare}%
                  </span>
                  <span className={`text-xs font-mono font-bold ${style.text}`}>
                    {sortedHolders[0].pnl >= 0 ? '+' : ''}{sortedHolders[0].pnl}%
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Whale 2 & 3 vertical stack */}
          <div className="col-span-5 flex flex-col gap-2">
            {sortedHolders[1] && (() => {
              const style = getPnlColor(sortedHolders[1].pnl);
              return (
                <div
                  className={`flex-1 border ${style.border} ${style.bg} p-1 flex flex-col justify-between transition-[background,border-color] duration-200`}
                  title={`${sortedHolders[1].name} holds ${sortedHolders[1].supplyShare}%`}
                >
                  <span className="text-xs text-slate-200 font-bold block truncate leading-tight">
                    {sortedHolders[1].name}
                  </span>
                  <div className="flex items-center justify-between text-[10px] font-mono mt-1">
                    <span className="text-slate-300 font-semibold">{sortedHolders[1].supplyShare}%</span>
                    <span className={style.text}>{sortedHolders[1].pnl >= 0 ? '+' : ''}{sortedHolders[1].pnl}%</span>
                  </div>
                </div>
              );
            })()}

            {sortedHolders[2] && (() => {
              const style = getPnlColor(sortedHolders[2].pnl);
              return (
                <div
                  className={`flex-1 border ${style.border} ${style.bg} p-1 flex flex-col justify-between transition-[background,border-color] duration-200`}
                  title={`${sortedHolders[2].name} holds ${sortedHolders[2].supplyShare}%`}
                >
                  <span className="text-xs text-slate-200 font-bold block truncate leading-tight">
                    {sortedHolders[2].name}
                  </span>
                  <div className="flex items-center justify-between text-[10px] font-mono mt-1">
                    <span className="text-slate-300 font-semibold">{sortedHolders[2].supplyShare}%</span>
                    <span className={style.text}>{sortedHolders[2].pnl >= 0 ? '+' : ''}{sortedHolders[2].pnl}%</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Small holders grid list below */}
        <div className={'grid grid-cols-4 gap-[6px]'}>
          {sortedHolders.slice(3, 7).map((holder) => {
            const style = getPnlColor(holder.pnl);
            return (
              <div
                key={holder.id}
                className={`border ${style.border} ${style.bg} p-1 flex flex-col justify-between transition-[background,border-color] duration-200`}
                title={`${holder.name} holds ${holder.supplyShare}%`}
              >
                <span className="text-[10px] text-slate-400 block truncate leading-none">
                  {holder.name.split(' ')[0]}
                </span>
                <span className="text-xs text-slate-200 font-semibold block leading-tight mt-1">
                  {holder.supplyShare}%
                </span>
                <span className={`text-[10px] block font-mono leading-none mt-0.5 ${style.text}`}>
                  {holder.pnl >= 0 ? '+' : ''}{Math.round(holder.pnl)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map Legend */}
      <div className="border-t border-dim bg-black/50 p-2 flex items-center justify-between text-[10px] text-white/50">
        <span className="flex items-center gap-1">
          <AlertCircle size={9} className="text-green-neon" />
          Color mapping indicates total realized yield (PnL%)
        </span>
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 bg-green-neon" />
          <span>PROFIT</span>
          <span className="w-1.5 h-1.5 bg-red-neon" />
          <span>LOSS</span>
        </div>
      </div>
    </div>
  );
});

export default HolderTreemap;
