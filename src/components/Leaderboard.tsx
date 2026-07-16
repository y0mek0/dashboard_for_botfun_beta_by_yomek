import React from 'react';
import { Agent } from '../types';
import { ShieldAlert, Award, Radio, RefreshCw } from 'lucide-react';

interface LeaderboardProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
}

const Leaderboard = React.memo(function Leaderboard({ agents, selectedAgentId, onSelectAgent }: LeaderboardProps) {
  // Sort agents by PnL descending
  const sortedAgents = [...agents].sort((a, b) => b.pnl - a.pnl);

  // Helper to generate Radar polygon coordinates
  const renderRadarSvg = (agent: Agent) => {
    // 5 axes: PnL (0-100), Trades (0-100), Volume (0-100), Mentions (0-100), Risk (0-100)
    // Scale down to 32x32 SVG viewport (center at 16, 16)
    const c = 16;
    const rMax = 12;

    const values = [
      agent.pnlScore / 100,      // Top axis (0 deg)
      agent.tradeCount % 100 / 100, // Right-Top (72 deg) - mapped to cyclic 0-100
      agent.volumeScore / 100,   // Right-Bottom (144 deg)
      agent.mentionScore / 100,  // Left-Bottom (216 deg)
      agent.riskScore / 100,     // Left-Top (288 deg)
    ];

    const angles = [
      -Math.PI / 2,
      -Math.PI / 2 + (Math.PI * 2) / 5,
      -Math.PI / 2 + ((Math.PI * 2) / 5) * 2,
      -Math.PI / 2 + ((Math.PI * 2) / 5) * 3,
      -Math.PI / 2 + ((Math.PI * 2) / 5) * 4,
    ];

    const points = values.map((val, idx) => {
      const radius = val * rMax;
      const x = c + radius * Math.cos(angles[idx]);
      const y = c + radius * Math.sin(angles[idx]);
      return `${x},${y}`;
    }).join(' ');

    const maxPoints = angles.map((_, idx) => {
      const x = c + rMax * Math.cos(angles[idx]);
      const y = c + rMax * Math.sin(angles[idx]);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="34" height="34" className="bg-black/40 p-0.5 border border-dim">
        {/* Background pentagram grid */}
        <polygon points={maxPoints} fill="none" stroke="rgba(0, 240, 255, 0.12)" strokeWidth="0.5" />
        {/* Radial lines */}
        {angles.map((angle, idx) => {
          const x = c + rMax * Math.cos(angle);
          const y = c + rMax * Math.sin(angle);
          return (
            <line key={idx} x1={c} y1={c} x2={x} y2={y} stroke="rgba(0, 240, 255, 0.08)" strokeWidth="0.5" />
          );
        })}
        {/* Data polygon */}
        <polygon points={points} fill={`${agent.color}25`} stroke={agent.color} strokeWidth="1" />
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full border border-dim bg-black/40 text-xs font-mono select-text">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dim bg-black/50 px-4 py-2">
        <div className="flex items-center space-x-2">
          <Award size={14} className="text-cyan-neon" />
          <span className="font-display text-sm font-semibold tracking-wider text-slate-200 uppercase">
            Agent Performance
          </span>
        </div>
        <div className="flex items-center space-x-1 text-[10px] text-white/40">
          <RefreshCw size={8} className="animate-spin text-cyan-neon" style={{ animationDuration: '4s' }} />
          <span>REALTIME CALC</span>
        </div>
      </div>

      {/* Agents Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-dim">
        {sortedAgents.map((agent, idx) => {
          const isSelected = selectedAgentId === agent.id;
          const isPositive = agent.pnl >= 0;

          // Status colors
          let statusColor = 'bg-white/40';
          let pulseClass = '';
          if (agent.status === 'ANALYZING') {
            statusColor = 'bg-cyan-neon';
            pulseClass = 'animate-pulse';
          } else if (agent.status === 'EXECUTING') {
            statusColor = 'bg-green-neon';
            pulseClass = 'animate-ping';
          } else if (agent.status === 'POSTING') {
            statusColor = 'bg-purple-500';
            pulseClass = 'animate-pulse';
          }

          return (
            <div
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              className={`p-2 flex items-center justify-between gap-2 row-hover cursor-pointer ${
                isSelected ? 'bg-cyan-neon/5 border-l border-cyan-neon' : ''
              }`}
            >
              {/* Rank and Name */}
              <div className="flex items-center space-x-2 w-[40%]">
                <span className="text-white/30 text-xs font-bold w-4">
                  {idx + 1}
                </span>

                <div className="relative flex items-center justify-center w-2 h-2 mr-1">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusColor} ${pulseClass}`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusColor}`}></span>
                </div>

                <div className="flex flex-col">
                  <span className="font-semibold text-slate-200 tracking-tight leading-tight hover:text-white truncate text-sm" style={{ color: isSelected ? '#00F0FF' : undefined }}>
                    {agent.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-white/60 uppercase leading-none mt-0.5">
                                      {agent.status}
                  </span>
                </div>
              </div>

              {/* Mini Radar Visual */}
              <div className="flex items-center justify-center" title="PnL • Trd • Vol • Men • Risk">
                {renderRadarSvg(agent)}
              </div>

              {/* PnL Bars & Data */}
              <div className="flex flex-col items-end text-right w-[40%]">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-white/40">TRD:</span>
                  <span className="text-slate-300 font-medium">{agent.tradeCount}</span>
                  <span className={`font-semibold text-[11px] ${isPositive ? 'text-green-neon' : 'text-red-neon'}`}>
                    {isPositive ? '▲' : '▼'} {agent.pnl.toFixed(1)}%
                  </span>
                </div>

                {/* Micro Horizontal PnL Visualizer */}
                <div className="w-24 bg-black border border-dim/50 h-1 mt-1 rounded-none overflow-hidden relative">
                  <div
                    className={`h-full rounded-none ${isPositive ? 'bg-green-neon' : 'bg-red-neon'}`}
                    style={{ width: `${Math.min(100, Math.max(10, Math.abs(agent.pnl)))}%` }}
                  />
                </div>

                <div className="flex items-center space-x-2 text-[10px] text-white/30 mt-1">
                  <span>REAL: <span className="text-white/50">${agent.realized.toLocaleString()}</span></span>
                  <span>•</span>
                  <span>UNR: <span className="text-white/50">${agent.unrealized.toLocaleString()}</span></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer statistics summary */}
      <div className="border-t border-dim bg-black/50 p-2 flex items-center justify-between text-xs text-white/40 interactive">
        <span className="flex items-center gap-1">
          <Radio size={10} className="text-cyan-neon animate-pulse" />
          ACTIVE DEPLOY: {agents.filter(a => a.status !== 'IDLE').length} / {agents.length} AGENTS
        </span>
        <span className="text-[10px] text-white/30">SORT BY: PNL_NET</span>
      </div>
    </div>
  );
});

export default Leaderboard;
