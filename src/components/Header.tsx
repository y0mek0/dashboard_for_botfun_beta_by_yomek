import { useEffect, useState } from 'react';
import { SystemStats } from '../types';

interface HeaderProps {
  stats: SystemStats;
  isPaused: boolean;
  setIsPaused: (p: boolean) => void;
  dataSource: 'api' | 'error';
}

export default function Header({ stats, isPaused, setIsPaused, dataSource }: HeaderProps) {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => setUtcTime(new Date().toUTCString().replace('GMT', 'UTC'));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-auto md:h-12 border-b border-dim flex flex-col md:flex-row items-center px-6 py-3 md:py-0 justify-between bg-black/40">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-neon rounded-sm shadow-[0_0_8px_#00F0FF]"></div>
          <span className="text-base font-bold tracking-widest text-white">BOTIC · AI TERMINAL</span>
          <span className="text-xs font-mono text-cyan-neon border border-cyan-neon/30 px-1 py-0.2 bg-cyan-neon/5 rounded-xs">V2.0</span>
        </div>
        
        <div className="flex items-center gap-4 text-[10px] text-white/50">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-neon animate-pulse"></span>
            <span>NETWORK: ONLINE</span>
          </div>
          <div className={`flex items-center gap-1 border-l border-white/10 pl-3 text-[10px] font-mono font-bold ${
            dataSource === 'api' ? 'text-green-neon' : 'text-red-neon'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dataSource === 'api' ? 'bg-green-neon animate-pulse' : 'bg-red-neon'}`} />
            {dataSource === 'api' ? 'LIVE API' : 'NO DATA'}
          </div>
        </div>
      </div>

      {/* Pause/Resume polling */}
      <div className="flex items-center gap-2 border border-dim px-2 py-0.5 bg-black/60 my-2 md:my-0">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`font-mono text-xs uppercase px-2 py-1 cursor-pointer interactive ${
            isPaused ? 'bg-amber-950/40 text-amber-400 border border-amber-600/30' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <span className="text-white/40 font-mono text-[11px]">
          {stats.coinsCount > 0 ? `${stats.coinsCount} coins · ${stats.agentsCount} agents · ${stats.tradesCount.toLocaleString()} trades` : 'Loading...'}
        </span>
      </div>

      <div className="flex gap-6 md:gap-8">
        <div className="flex flex-col items-end">
          <span className="text-white/40 uppercase text-[10px]">TIA/USD</span>
          <span className="text-white font-mono">${stats.tiaPrice.toFixed(4)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-white/40 uppercase text-[10px]">TPS</span>
          <span className="text-white font-mono">{stats.tps > 0 ? stats.tps : '—'}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-white/40 uppercase text-[10px]">UTC</span>
          <span className="text-white font-mono text-[11px]">{utcTime}</span>
        </div>
      </div>
    </header>
  );
}
