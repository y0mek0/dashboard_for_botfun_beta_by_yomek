import { useEffect, useState } from 'react';
import { SystemStats } from '../types';
import { Shield, Zap, Cpu, Network, Clock } from 'lucide-react';

interface HeaderProps {
  stats: SystemStats;
  speed: number;
  setSpeed: (v: number) => void;
  isPaused: boolean;
  setIsPaused: (p: boolean) => void;
}

export default function Header({ stats, speed, setSpeed, isPaused, setIsPaused }: HeaderProps) {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
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
          <span className="text-xs font-mono text-cyan-neon border border-cyan-neon/30 px-1 py-0.2 bg-cyan-neon/5 rounded-xs">
            V1.0.42
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-[10px] text-white/50">
          <div className="flex items-center gap-[6px]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-neon animate-pulse"></span>
            <span>NETWORK: ONLINE</span>
          </div>
          <div className="flex items-center gap-1 border-l border-white/10 pl-3">
            <span>NODES: 1,842</span>
          </div>
          <div className="flex items-center gap-[6px] border-l border-white/10 pl-3 text-green-neon">
            <span className="animate-ping inline-flex h-1 w-1 rounded-full bg-green-neon opacity-75"></span>
            <span>● LIVE</span>
          </div>
        </div>
      </div>

      {/* Center Control / Sim Controls */}
      <div className="flex items-center gap-2 border border-dim px-2 py-0.5 bg-black/60 my-2 md:my-0 text-micro">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`font-mono text-xs uppercase px-2 py-1 cursor-pointer interactive select-none ${
            isPaused
              ? 'bg-amber-950/40 text-amber-400 border border-amber-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          {isPaused ? '▶ Play' : '⏸ Pause'}
        </button>

        <span className="text-white/40 font-mono text-[11px]">{'FREQ:'}</span>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="bg-black border border-dim text-white font-mono text-xs px-2 py-0.5 outline-none cursor-pointer"
        >
          <option value={4000}>0.25 Hz</option>
          <option value={2000}>0.5 Hz</option>
          <option value={1000}>1.0 Hz</option>
          <option value={500}>2.0 Hz</option>
        </select>
      </div>

      <div className="flex gap-6 md:gap-8 text-micro">
        <div className="flex flex-col items-end">
          <span className="text-white/40 uppercase text-[10px]">Block Height</span>
          <span className="text-white font-mono">{stats.blockHeight}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-white/40 uppercase text-[10px]">Latency</span>
          <span className="text-cyan-neon font-mono">{stats.latency}ms</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-white/40 uppercase text-[10px]">TPS</span>
          <span className="text-white font-mono">{stats.tps}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-white/40 uppercase text-[10px]">UTC Time</span>
          <span className="text-white font-mono">{utcTime}</span>
        </div>
      </div>
    </header>
  );
}
