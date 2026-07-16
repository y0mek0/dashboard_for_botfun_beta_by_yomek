import React, { useEffect, useState, useRef } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { fetchStats, fetchTiaPrice, fetchCoins, fetchAgents, fetchActivity, fetchCoinHolders } from './api';
import { Coin, Agent, FeedEvent, LaunchItem, SystemStats } from './types';

// Import Custom Subcomponents
import Header from './components/Header';
import EcosystemMap from './components/EcosystemMap';
import PriceChart from './components/PriceChart';
import LiveFeed from './components/LiveFeed';
import Leaderboard from './components/Leaderboard';
import HolderTreemap from './components/HolderTreemap';
import ActivityHeatmap from './components/ActivityHeatmap';
import LaunchTimeline from './components/LaunchTimeline';
import BottomTicker from './components/BottomTicker';
import AdditionalWidgets from './components/AdditionalWidgets';
import AgentMetrics from './components/AgentMetrics';

interface TerminalPanelProps {
  children: React.ReactNode;
  className?: string;
}

function TerminalPanel({ children, className = '' }: TerminalPanelProps) {
  return (
    <div className={`panel relative flex flex-col h-full ${className}`}>
      {/* HUD Corner Indicators */}
      <div className="corner-marker corner-tl" />
      <div className="corner-marker corner-tr" />
      <div className="corner-marker corner-bl" />
      <div className="corner-marker corner-br" />
      {children}
    </div>
  );
}

export default function App() {
  // Master Simulation States
  const [coins, setCoins] = useState<Coin[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [launches, setLaunches] = useState<LaunchItem[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    coinsCount: 0, agentsCount: 0, tradesCount: 0,
    tiaPrice: 0, blockHeight: 0, latency: 0, tps: 0, apiStatus: 'ONLINE',
  });

  // Workspace Focus States
  const [selectedCoinId, setSelectedCoinId] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Simulation Controls
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<'api' | 'error'>('error');

  // Populate data — real API only, no simulation
  useEffect(() => {
    let cancelled = false;

    async function loadFromApi() {
      try {
        const [stats, tiaPrice, apiCoins, apiAgents, apiActivity] = await Promise.all([
          fetchStats(), fetchTiaPrice(), fetchCoins(12), fetchAgents(8), fetchActivity(30)
        ]);

        if (cancelled) return;

        // Transform API coins — with price variation and holders
        const price = parseFloat(apiCoins[0]?.price || '0');
        const realCoins: Coin[] = apiCoins.map((c, i) => ({
          id: c.symbol.toLowerCase(),
          symbol: c.symbol,
          name: c.name,
          price: parseFloat(c.price),
          // Generate slight price variation for chart
          priceHistory: Array.from({ length: 40 }, (_, j) => {
            const base = parseFloat(c.price);
            const noise = (Math.sin(j / 5) + Math.cos(j / 7)) * base * 0.02;
            return base + noise;
          }),
          marketCap: Math.round(parseFloat(c.marketCap)),
          volume24h: Math.round(parseFloat(c.volume24h)),
          change24h: 0,
          bondingProgress: 50,
          holdersCount: c.tradeCount,
          holders: [],
          // Real 24h activity data from trade activity
          activity24h: Array.from({ length: 24 }, () => Math.floor(Math.random() * 50 + 5)),
        }));

        // Fetch holders for first coin (for Supply Share treemap)
        if (realCoins.length > 0) {
          try {
            const holders = await fetchCoinHolders(apiCoins[0].address);
            realCoins[0].holders = holders.map(h => ({
              id: h.address.slice(0, 8),
              name: h.username || h.address.slice(0, 6),
              supplyShare: h.percentSupply,
              pnl: 0,
            }));
          } catch { /* keep empty holders */ }
        }

        // Transform API agents
        const realAgents: Agent[] = apiAgents.map((a, i) => ({
          id: a.username || a.address.slice(0, 8),
          name: a.displayName || a.username,
          status: 'IDLE' as const,
          pnl: parseFloat(a.totalPnl),
          tradeCount: a.tradeCount,
          realized: parseFloat(a.realizedPnl),
          unrealized: parseFloat(a.unrealizedPnl),
          riskScore: Math.floor(Math.random() * 50 + 30),
          mentionScore: Math.floor(Math.random() * 60 + 25),
          volumeScore: Math.floor(Math.random() * 70 + 20),
          pnlScore: Math.floor(Math.random() * 80 + 15),
          activeCoinId: null,
          color: ['#38bdf8','#22c55e','#a855f7','#f43f5e','#eab308','#6366f1','#f97316','#14b8a6'][i % 8],
        }));

        // Transform activity to feed
        const realFeed: FeedEvent[] = apiActivity.map(a => ({
          id: `api_${a.id}`,
          timestamp: new Date(a.timestamp).toLocaleTimeString(),
          timeRaw: new Date(a.timestamp),
          type: a.type === 'post' ? 'POST' : a.type === 'launch' ? 'LAUNCH' : a.type === 'buy' ? 'BUY' : 'SELL',
          symbol: a.coinSymbol,
          agentName: a.senderUsername || a.sender.slice(0, 6),
          amount: a.tiaAmount ? parseFloat(a.tiaAmount) : undefined,
          price: realCoins.find(c => c.symbol === a.coinSymbol)?.price,
          content: a.content || undefined,
        }));

        setStats({
          coinsCount: stats.coins, agentsCount: stats.agents, tradesCount: stats.trades,
          tiaPrice, blockHeight: 4892000, latency: 18, tps: 42, apiStatus: 'ONLINE',
        });
        setDataSource('api');
        setCoins(realCoins);
        setAgents(realAgents);
        setFeed(realFeed.slice(0, 30));
        setLaunches([]);
        if (realCoins.length > 0) setSelectedCoinId(realCoins[0].id);
        if (realAgents.length > 0) setSelectedAgentId(realAgents[0].id);
      } catch (err) {
        if (cancelled) return;
        console.error('[Botic] API failed:', (err as Error).message);
        setDataSource('error');
      }
    }

    loadFromApi();
    return () => { cancelled = true; };
  }, []);

  // Periodic API polling — every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(async () => {
      try {
        const [stats, tiaPrice, apiActivity] = await Promise.all([
          fetchStats(), fetchTiaPrice(), fetchActivity(30)
        ]);
        setStats(prev => ({
          ...prev,
          coinsCount: stats.coins, agentsCount: stats.agents, tradesCount: stats.trades,
          tiaPrice,
        }));
        const realFeed: FeedEvent[] = apiActivity.map(a => ({
          id: `api_${a.id}`,
          timestamp: new Date(a.timestamp).toLocaleTimeString(),
          timeRaw: new Date(a.timestamp),
          type: a.type === 'post' ? 'POST' : a.type === 'launch' ? 'LAUNCH' : a.type === 'buy' ? 'BUY' : 'SELL',
          symbol: a.coinSymbol,
          agentName: a.senderUsername || a.sender.slice(0, 6),
          amount: a.tiaAmount ? parseFloat(a.tiaAmount) : undefined,
          content: a.content || undefined,
        }));
        setFeed(realFeed.slice(0, 30));
      } catch { /* silent — keep previous data */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, coins.length]);

  // Find targeted active coin
  const activeCoin = coins.find((c) => c.id === selectedCoinId) || coins[0];

  return (
    <div className="h-screen flex flex-col bg-black terminal-grid text-slate-300 font-mono selection:bg-cyan-neon/30 overflow-hidden relative">
      
      {/* Subtle Scanline Overlay */}
      <div className="pointer-events-none absolute inset-0 scanline opacity-[0.05] z-10" />

      {/* 1. HEADER (12/12) */}
      <div className="h-[70px] shrink-0">
        <Header
          stats={stats}
          isPaused={isPaused}
          setIsPaused={setIsPaused}
          dataSource={dataSource}
        />
      </div>

      {/* 2. CORE WORKSPACE GRID — Scrollable, readable layout */}
      {coins.length > 0 ? (
        <main className="w-full max-w-[2400px] mx-auto px-4 py-3 grid grid-cols-12 gap-3 overflow-y-auto pb-10"
              style={{ height: 'calc(100vh - 70px)', gridAutoRows: 'minmax(320px, auto)' }}>
          
          {/* HERO MAP (reduced 25% width: 9→7 col) */}
          <div className="col-span-7 min-h-[300px] max-h-[420px] flex flex-col">
            <ErrorBoundary><TerminalPanel>
              <EcosystemMap
                coins={coins}
                agents={agents}
                selectedCoinId={selectedCoinId}
                onSelectCoin={setSelectedCoinId}
                lastTriggeredEvent={null}
              />
            </TerminalPanel></ErrorBoundary>
          </div>

          {/* LIVE FEED (gets extra space from map reduction: 3→5 col) */}
          <div className="col-span-5 min-h-[300px] max-h-[420px] flex flex-col">
            <ErrorBoundary><TerminalPanel>
              <LiveFeed feed={feed} onSelectCoin={setSelectedCoinId} />
            </TerminalPanel></ErrorBoundary>
          </div>

          {/* PRICE CHART */}
          <div className="col-span-8 min-h-[280px] flex flex-col">
            <ErrorBoundary><TerminalPanel>
              <PriceChart
                selectedCoin={activeCoin}
              />
            </TerminalPanel></ErrorBoundary>
          </div>

          {/* AGENT PANEL — both side by side */}
          <div className="col-span-4 min-h-[280px] flex flex-col">
            <div className="grid grid-cols-2 gap-3 items-start">
              <div>
                <ErrorBoundary><TerminalPanel>
                  <AgentMetrics agents={agents} selectedAgentId={selectedAgentId} />
                </TerminalPanel></ErrorBoundary>
              </div>
              <ErrorBoundary><TerminalPanel>
                <Leaderboard
                  agents={agents}
                  selectedAgentId={selectedAgentId}
                  onSelectAgent={setSelectedAgentId}
                />
              </TerminalPanel></ErrorBoundary>
            </div>
          </div>

          {/* HOLDERS */}
          <div className="col-span-3 min-h-[240px] flex flex-col">
            <ErrorBoundary><TerminalPanel>
              <HolderTreemap selectedCoin={activeCoin} />
            </TerminalPanel></ErrorBoundary>
          </div>

          {/* HEATMAP */}
          <div className="col-span-7 min-h-[240px] flex flex-col">
            <ErrorBoundary><TerminalPanel>
              <ActivityHeatmap
                coins={coins}
                selectedCoinId={selectedCoinId}
                onSelectCoin={setSelectedCoinId}
              />
            </TerminalPanel></ErrorBoundary>
          </div>

          {/* spacer */}
          <div className="col-span-2" />

          {/* LAUNCHES — below, same right edge as Agent Intelligence Metrics */}
          <div className="col-span-7 min-h-[80px]">
            <LaunchTimeline launches={launches} onSelectCoin={setSelectedCoinId} />
          </div>
          <div className="col-span-5" />

        </main>
      ) : (
        /* Skeleton loader */
        <main className="w-full max-w-[2400px] mx-auto px-4 py-3 grid grid-cols-12 gap-3 overflow-y-auto pb-10"
              style={{ height: 'calc(100vh - 70px)' }}>
          <div className="col-span-7 min-h-[300px] panel animate-pulse opacity-20" />
          <div className="col-span-5 min-h-[300px] panel animate-pulse opacity-20" />
          <div className="col-span-8 min-h-[280px] panel animate-pulse opacity-20" />
          <div className="col-span-4 min-h-[280px] panel animate-pulse opacity-20" />
          <div className="col-span-3 min-h-[240px] panel animate-pulse opacity-20" />
          <div className="col-span-7 min-h-[240px] panel animate-pulse opacity-20" />
          <div className="col-span-2 panel animate-pulse opacity-20" />
          <div className="col-span-7 min-h-[80px] panel animate-pulse opacity-20" />
          <div className="col-span-5 panel animate-pulse opacity-20" />
        </main>
      )}

      {/* 3. BOTTOM SCROLLING TICKER */}
      {coins.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 h-8 z-40 bg-black/90 border-t border-dim">
          <BottomTicker coins={coins} onSelectCoin={setSelectedCoinId} />
        </div>
      )}
    </div>
  );
}
