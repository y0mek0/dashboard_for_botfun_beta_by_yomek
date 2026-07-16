import React from 'react';
import { FeedEvent } from '../types';
import { MessageSquare, ArrowUpRight, ArrowDownRight, Radio, ShieldAlert } from 'lucide-react';

interface LiveFeedProps {
  feed: FeedEvent[];
  onSelectCoin: (id: string) => void;
}

const LiveFeed = React.memo(function LiveFeed({ feed, onSelectCoin }: LiveFeedProps) {
  return (
    <div className="flex flex-col h-full border border-dim bg-black/40 text-sm font-mono select-text">
      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-dim bg-black/50 px-4 py-2">
        <div className="flex items-center space-x-2">
          <MessageSquare size={14} className="text-cyan-neon" />
          <span className="font-display text-sm font-semibold tracking-wider text-slate-200 uppercase">
            Ecosystem Transaction Ledger
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-neon opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-neon"></span>
          </span>
          <span className="text-[10px] text-white/50 font-bold uppercase">STREAMING</span>
        </div>
      </div>

      {/* Feed List Container */}
      <div className="flex-1 overflow-y-auto px-2 py-1 max-h-[380px] divide-y divide-dim">
        {feed.map((evt) => {
          const isBuy = evt.type === 'BUY';
          const isSell = evt.type === 'SELL';
          const isPost = evt.type === 'POST';
          const isLaunch = evt.type === 'LAUNCH';

          return (
            <div
              key={evt.id}
              onClick={() => onSelectCoin(evt.symbol.toLowerCase())}
              className="py-2 row-hover cursor-pointer flex flex-col gap-1"
            >
              {/* Event Badge and Timestamp Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {/* Styled Event Badge */}
                  {isBuy && (
                    <span className="flex items-center bg-green-neon/10 text-green-neon border border-green-neon/20 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                      <ArrowUpRight size={10} className="mr-0.5 inline" /> BUY
                    </span>
                  )}
                  {isSell && (
                    <span className="flex items-center bg-red-neon/10 text-red-neon border border-red-neon/20 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                      <ArrowDownRight size={10} className="mr-0.5 inline" /> SELL
                    </span>
                  )}
                  {isPost && (
                    <span className="flex items-center bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                      ★ POST
                    </span>
                  )}
                  {isLaunch && (
                    <span className="flex items-center bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/20 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                      ⚡ LAUNCH
                    </span>
                  )}

                  {/* Agent identity */}
                  {evt.agentName && (
                    <span className="text-white/60 font-bold text-xs">
                      {evt.agentName.split(' ')[0]}
                    </span>
                  )}
                </div>

                {/* Relative timestamp */}
                <span className="text-[10px] text-white/30 font-mono">
                  {evt.timestamp}
                </span>
              </div>

              {/* Event Body Content */}
              <div className="text-xs leading-relaxed">
                {isBuy && (
                  <span className="text-slate-300">
                    Swapped <span className="text-cyan-neon font-bold">{evt.amount} TIA</span> for{' '}
                    <span className="text-green-neon font-bold">${evt.symbol}</span> @ ${evt.price?.toFixed(4)}
                  </span>
                )}
                {isSell && (
                  <span className="text-slate-300">
                    Liquidated <span className="text-red-neon font-bold">{evt.amount} TIA</span> worth of{' '}
                    <span className="text-cyan-neon font-bold">${evt.symbol}</span> @ ${evt.price?.toFixed(4)}
                  </span>
                )}
                {isPost && (
                  <span className="text-white/50 italic">
                    "{evt.content}"
                  </span>
                )}
                {isLaunch && (
                  <span className="text-cyan-neon font-bold">
                    {evt.content}
                  </span>
                )}
              </div>

              {/* Hover trigger hint */}
              <div className="flex items-center justify-between text-[10px] text-white/30 mt-0.5 leading-none">
                <span>TARGET_STAKE: ${evt.symbol}</span>
                <span>ID: {evt.id.split('_').slice(-1)}</span>
              </div>
            </div>
          );
        })}

        {feed.length === 0 && (
          <div className="py-8 text-center text-white/40 flex flex-col items-center justify-center gap-[6px]">
            <ShieldAlert size={16} />
            <span>LISTENING FOR INCOMING BLOCKS</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-dim bg-black/50 p-2 flex items-center justify-between text-[10px] text-white/40">
        <span className="flex items-center gap-1 uppercase">
          <Radio size={9} className="text-cyan-neon animate-pulse" />
          WS_feed_con: connected
        </span>
        <span className="text-white/30">LEN: {feed.length} EVENTS</span>
      </div>
    </div>
  );
});

export default LiveFeed;
