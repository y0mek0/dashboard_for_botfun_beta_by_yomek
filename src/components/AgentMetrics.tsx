import React, { useEffect, useState } from 'react';
import { Agent } from '../types';
import { Cpu, Server, Activity, Disc } from 'lucide-react';

interface AgentMetricsProps {
  agents: Agent[];
  selectedAgentId: string | null;
}

const AgentMetrics = React.memo(function AgentMetrics({ agents, selectedAgentId }: AgentMetricsProps) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => (p + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  // Count agent statuses
  const statusCounts = agents.reduce(
    (acc, agent) => {
      acc[agent.status] = (acc[agent.status] || 0) + 1;
      return acc;
    },
    { IDLE: 0, ANALYZING: 0, EXECUTING: 0, POSTING: 0 } as Record<string, number>
  );

  const totalAgents = agents.length || 1;

  // Calculate some aggregate values for display
  const averagePnL = agents.reduce((sum, a) => sum + (a.pnl || 0), 0) / totalAgents;
  const totalTrades = agents.reduce((sum, a) => sum + (a.tradeCount || 0), 0);

  return (
    <div className="flex flex-col h-full border border-dim bg-black/40 text-xs font-mono select-text">
      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-dim bg-black/50 px-4 py-2">
        <div className="flex items-center space-x-2">
          <Cpu size={14} className="text-cyan-neon" />
          <span className="font-display text-sm font-semibold tracking-wider text-slate-200 uppercase">
            Agent Intelligence Metrics
          </span>
        </div>
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-neon opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-neon"></span>
        </span>
      </div>

      {/* Main Stats Area — compact */}
      <div className="p-2 flex flex-col gap-2">
        
        {/* Core HUD readout */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="border border-dim bg-black/25 p-2 flex flex-col justify-center">
            <span className="text-[10px] text-white/40 uppercase">AVG PNL</span>
            <span className={`text-base font-bold ${averagePnL >= 0 ? 'text-green-neon' : 'text-red-neon'}`}>
              {averagePnL >= 0 ? '+' : ''}{averagePnL.toFixed(1)}%
            </span>
          </div>
          <div className="border border-dim bg-black/25 p-2 flex flex-col justify-center">
            <span className="text-[10px] text-white/40 uppercase">TOT TRADES</span>
            <span className="text-base font-bold text-cyan-neon">
              {totalTrades}
            </span>
          </div>
        </div>

        {/* Cognitive Load Pulse Radar — compact */}
        <div className="flex items-center justify-center gap-2 border border-dim/40 bg-black/20 p-2">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border border-cyan-neon/25 animate-ping"
              style={{ animationDuration: '3s' }}
            />
            <div
              className="absolute inset-0 rounded-full border border-dim"
              style={{
                transform: `rotate(${pulse * 2.5}deg)`,
                borderTopColor: '#00F0FF',
                borderRightColor: 'transparent',
                borderBottomColor: 'transparent',
                borderLeftColor: 'transparent',
              }}
            />
            <Disc
              size={10}
              className="text-cyan-neon animate-spin"
              style={{ animationDuration: '10s' }}
            />
          </div>

          <div className="flex-1 flex flex-col text-[9px] text-white/50 leading-tight gap-0.5">
            <div className="flex justify-between border-b border-dim/20 pb-0.5">
              <span>COGNITION</span>
              <span className="text-cyan-neon font-bold">ONLINE</span>
            </div>
            <div className="flex justify-between">
              <span>LATENCY:</span>
              <span className="text-white/80">{(12 + Math.sin(pulse / 10) * 2).toFixed(1)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>RATE:</span>
              <span className="text-white/80">{(1.5 + Math.cos(pulse / 15) * 0.4).toFixed(2)}/s</span>
            </div>
          </div>
        </div>

        {/* State Distributions */}
        <div className="flex flex-col gap-1 text-[8px] border-t border-dim/30 pt-2">
          <span className="text-[10px] text-white/40 uppercase mb-0.5 tracking-wider">State Distribution</span>
          
          {/* EXECUTING */}
          <div className="flex items-center justify-between gap-[6px]">
            <span className="w-12 text-green-neon font-semibold">EXECUTING</span>
            <div className="flex-1 bg-black border border-dim/40 h-1.5 relative overflow-hidden">
              <div
                className="bg-green-neon h-full transition-all duration-300"
                style={{ width: `${(statusCounts.EXECUTING / totalAgents) * 100}%` }}
              />
            </div>
            <span className="w-4 text-right font-bold text-white/80">{statusCounts.EXECUTING}</span>
          </div>

          {/* ANALYZING */}
          <div className="flex items-center justify-between gap-[6px]">
            <span className="w-12 text-cyan-neon font-semibold">ANALYZING</span>
            <div className="flex-1 bg-black border border-dim/40 h-1.5 relative overflow-hidden">
              <div
                className="bg-cyan-neon h-full transition-all duration-300"
                style={{ width: `${(statusCounts.ANALYZING / totalAgents) * 100}%` }}
              />
            </div>
            <span className="w-4 text-right font-bold text-white/80">{statusCounts.ANALYZING}</span>
          </div>

          {/* POSTING */}
          <div className="flex items-center justify-between gap-[6px]">
            <span className="w-12 text-purple-400 font-semibold">POSTING</span>
            <div className="flex-1 bg-black border border-dim/40 h-1.5 relative overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-300"
                style={{ width: `${(statusCounts.POSTING / totalAgents) * 100}%` }}
              />
            </div>
            <span className="w-4 text-right font-bold text-white/80">{statusCounts.POSTING}</span>
          </div>

          {/* IDLE */}
          <div className="flex items-center justify-between gap-[6px]">
            <span className="w-12 text-white/30 font-semibold">IDLE</span>
            <div className="flex-1 bg-black border border-dim/40 h-1.5 relative overflow-hidden">
              <div
                className="bg-white/20 h-full transition-all duration-300"
                style={{ width: `${(statusCounts.IDLE / totalAgents) * 100}%` }}
              />
            </div>
            <span className="w-4 text-right font-bold text-white/40">{statusCounts.IDLE}</span>
          </div>
        </div>

      </div>

      {/* Mini Diagnostic status */}
      <div className="border-t border-dim bg-black/50 p-2 flex items-center justify-between text-[10px] text-white/30">
        <span>CORE: ANTIGRAVITY_v2</span>
        <span>SYS_HEALTH: 100%</span>
      </div>
    </div>
  );
});

export default AgentMetrics;
