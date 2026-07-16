import React, { useEffect, useState, useRef } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { fetchStats, fetchTiaPrice, fetchCoins, fetchAgents, fetchActivity, fetchCoinCandles } from './api';
import {
  getInitialCoins,
  getInitialAgents,
  getInitialFeed,
  getInitialLaunches,
  getInitialStats,
  tickSimulation,
} from './simulation';
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
  const [stats, setStats] = useState<SystemStats>(getInitialStats());

  // Workspace Focus States
  const [selectedCoinId, setSelectedCoinId] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Simulation Controls
  const [speed, setSpeed] = useState<number>(1000); // 1.0 Hz default tick
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [lastTriggeredEvent, setLastTriggeredEvent] = useState<FeedEvent | null>(null);

  // Populate data — try real API first, fallback to simulation
  useEffect(() => {
    let cancelled = false;

    async function loadFromApi() {
      try {
        const [stats, tiaPrice, apiCoins, apiAgents, apiActivity] = await Promise.all([
          fetchStats(), fetchTiaPrice(), fetchCoins(12), fetchAgents(8), fetchActivity(30)
        ]);

        if (cancelled) return;

        // Transform API coins to Coin type
        const realCoins: Coin[] = await Promise.all(apiCoins.map(async (c, i) => {
          let priceHistory: number[] = [];
          try {
            const candles = await fetchCoinCandles(c.address, '1h', 40);
            priceHistory = candles.map(k => parseFloat(k.close));
          } catch {
            priceHistory = Array(40).fill(parseFloat(c.price));
          }
          return {
            id: c.symbol.toLowerCase(),
            symbol: c.symbol,
            name: c.name,
            price: parseFloat(c.price),
            priceHistory: priceHistory.length ? priceHistory : Array(40).fill(parseFloat(c.price)),
            marketCap: Math.round(parseFloat(c.marketCap)),
            volume24h: Math.round(parseFloat(c.volume24h)),
            change24h: i < 2 ? 5 + Math.random() * 10 : -5 + Math.random() * 10,
            bondingProgress: Math.min(99, 30 + Math.random() * 60),
            holdersCount: c.tradeCount,
            holders: [],
            activity24h: Array(24).fill(0).map(() => Math.floor(Math.random() * 80 + 10)),
          };
        }));

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
        setCoins(realCoins);
        setAgents(realAgents);
        setFeed(realFeed.slice(0, 30));
        setLaunches(getInitialLaunches()); // launches from sim
        if (realCoins.length > 0) setSelectedCoinId(realCoins[0].id);
        if (realAgents.length > 0) setSelectedAgentId(realAgents[0].id);
      } catch (err) {
        if (cancelled) return;
        console.warn('[Botic] API unavailable, using simulation:', (err as Error).message);
        loadSimulation();
      }
    }

    function loadSimulation() {
      const initialCoins = getInitialCoins();
      const initialAgents = getInitialAgents();
      setCoins(initialCoins);
      setAgents(initialAgents);
      setFeed(getInitialFeed(initialCoins, initialAgents));
      setLaunches(getInitialLaunches());
      setStats(getInitialStats());
      if (initialCoins.length > 0) setSelectedCoinId(initialCoins[0].id);
      if (initialAgents.length > 0) setSelectedAgentId(initialAgents[0].id);
    }

    loadFromApi();
    return () => { cancelled = true; };
  }, []);

  // Main Continuous Simulation interval Loop
  useEffect(() => {
    if (isPaused || coins.length === 0) return;

    const interval = setInterval(() => {
      const nextState = tickSimulation(coins, agents, feed, launches, stats);
      
      setCoins(nextState.coins);
      setAgents(nextState.agents);
      setFeed(nextState.feed);
      setLaunches(nextState.launches);
      setStats(nextState.stats);
      
      if (nextState.triggeredEvent) {
        setLastTriggeredEvent(nextState.triggeredEvent);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [isPaused, coins, agents, feed, launches, stats, speed]);

  // Handle manual Quick Trade (allows user to directly manipulate the asset statistics)
  const handleQuickTrade = (coinId: string, type: 'BUY' | 'SELL', amount: number) => {
    const targetCoinIndex = coins.findIndex((c) => c.id === coinId);
    if (targetCoinIndex === -1) return;

    const targetCoin = coins[targetCoinIndex];
    const isBuy = type === 'BUY';
    
    // Direct percentage price impact
    const priceImpact = (amount / targetCoin.marketCap) * 15 + (isBuy ? 0.04 : -0.035);
    const updatedPrice = Math.max(0.001, targetCoin.price * (1 + priceImpact));
    const updatedHistory = [...targetCoin.priceHistory.slice(1), updatedPrice];
    const updatedCap = Math.round(updatedPrice * (10000000 + targetCoinIndex * 500000));
    const updatedBonding = Math.min(99.9, Math.max(10, targetCoin.bondingProgress + (priceImpact * 75)));

    // Select random agent representing user or autonomous entity
    const randAgent = agents[Math.floor(Math.random() * agents.length)];

    // Construct precise manual log feed item
    const manualEvent: FeedEvent = {
      id: `manual_tx_${Date.now()}`,
      timestamp: 'Just now',
      timeRaw: new Date(),
      type: type,
      agentId: randAgent.id,
      agentName: `${randAgent.name.split(' ')[0]} (Manual)`,
      symbol: targetCoin.symbol,
      amount: amount,
      price: updatedPrice,
    };

    // Update Coin State
    const nextCoins = coins.map((c) => {
      if (c.id === coinId) {
        // Update holder shares slightly
        const updatedHolders = c.holders.map((h, hIdx) => {
          const shift = (Math.random() * 2 - 1) * 0.1;
          return {
            ...h,
            pnl: parseFloat((h.pnl + priceImpact * 100).toFixed(1)),
            supplyShare: parseFloat(Math.max(0.2, h.supplyShare + (hIdx === 0 ? shift : -shift / (c.holders.length - 1))).toFixed(1)),
          };
        });

        return {
          ...c,
          price: updatedPrice,
          priceHistory: updatedHistory,
          marketCap: updatedCap,
          volume24h: c.volume24h + amount,
          change24h: parseFloat((c.change24h + priceImpact * 100).toFixed(2)),
          bondingProgress: parseFloat(updatedBonding.toFixed(1)),
          holders: updatedHolders,
        };
      }
      return c;
    });

    // Update Agent parameters to align PnL
    const nextAgents = agents.map((a) => {
      if (a.id === randAgent.id) {
        return {
          ...a,
          status: 'EXECUTING' as const,
          activeCoinId: coinId,
          tradeCount: a.tradeCount + 1,
          unrealized: parseFloat(Math.max(100, a.unrealized + (isBuy ? amount * 0.1 : -amount * 0.05)).toFixed(1)),
          pnl: parseFloat((a.pnl + (isBuy ? 2.5 : -1.8)).toFixed(1)),
        };
      }
      return a;
    });

    // Master state update sequence
    setCoins(nextCoins);
    setAgents(nextAgents);
    setFeed([manualEvent, ...feed].slice(0, 30));
    setLastTriggeredEvent(manualEvent);
    setStats({
      ...stats,
      tradesCount: stats.tradesCount + 1,
      tps: parseFloat((stats.tps + 4.5).toFixed(1)),
    });
  };

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
          speed={speed}
          setSpeed={setSpeed}
          isPaused={isPaused}
          setIsPaused={setIsPaused}
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
                lastTriggeredEvent={lastTriggeredEvent}
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
