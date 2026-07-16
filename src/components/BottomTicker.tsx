import { Coin } from '../types';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface BottomTickerProps {
  coins: Coin[];
  onSelectCoin: (id: string) => void;
}

export default function BottomTicker({ coins, onSelectCoin }: BottomTickerProps) {
  // We duplicate the list to make a seamless infinite loop scrolling marquee!
  const tickerItems = [...coins, ...coins, ...coins];

  return (
    <footer className="border-t border-dim bg-black/60 h-8 flex items-center overflow-hidden select-text font-mono text-xs z-30 relative">
      {/* Absolute Left Label badge */}
      <div className="absolute left-0 top-0 bottom-0 bg-black/90 border-r border-dim px-4 flex items-center z-40 text-cyan-neon font-bold text-xs tracking-widest uppercase">
        MARKET COIN TICKER
      </div>

      {/* Marquee Scrolling Stream Track */}
      <div className="flex-1 pl-[140px] overflow-hidden">
        <div className="animate-ticker flex items-center gap-12 py-1">
          {tickerItems.map((coin, idx) => {
            const isUp = coin.change24h >= 0;
            return (
              <div
                key={`${coin.id}_ticker_${idx}`}
                onClick={() => onSelectCoin(coin.id)}
                className="flex items-center space-x-2 cursor-pointer interactive"
              >
                <span className="font-bold text-white/90 text-xs tracking-wider">
                  ${coin.symbol}
                </span>
                
                <span className="text-white/60 font-medium">
                  ${coin.price.toFixed(4)}
                </span>

                <span
                  className={`flex items-center font-bold text-[10px] px-2 py-0.5 border ${
                    isUp
                      ? 'text-green-neon border-green-neon/20 bg-green-neon/10'
                      : 'text-red-neon border-red-neon/20 bg-red-neon/10'
                  }`}
                >
                  {isUp ? (
                    <ArrowUp size={8} className="mr-0.5" />
                  ) : (
                    <ArrowDown size={8} className="mr-0.5" />
                  )}
                  {isUp ? '+' : ''}
                  {coin.change24h.toFixed(1)}%
                </span>

                <span className="text-white/30 font-mono text-[10px]">
                  VOL: ${(coin.volume24h / 1000).toFixed(0)}K
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Absolute Right indicators */}
      <div className="absolute right-0 top-0 bottom-0 bg-black/90 border-l border-dim px-4 flex items-center z-40 text-white/40 font-bold text-[10px] tracking-wider uppercase">
        SYS_BUFF_OK • 60 FPS
      </div>
    </footer>
  );
}
