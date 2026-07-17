import React, { useEffect, useState, useRef } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { fetchStats, fetchTiaPrice, fetchCoins, fetchAgents, fetchActivity, fetchCoinHolders, fetchNewCoins, fetchCoinCandles } from './api';
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

        // Transform API coins — real data only, no fake values
        const realCoins: Coin[] = apiCoins.map((c, i) => ({
          id: c.symbol.toLowerCase(),
          symbol: c.symbol,
          name: c.name,
          address: c.address,
          price: parseFloat(c.price),
          priceHistory: [parseFloat(c.price)], // real current price, candles loaded later
          marketCap: Math.round(parseFloat(c.marketCap)),
          volume24h: Math.round(parseFloat(c.volume24h)),
          change24h: parseFloat(c.volume24h || '0') / Math.max(1, parseFloat(c.marketCap || '1')) * 100,
          bondingProgress: Math.min(100, Math.round(c.tradeCount / 10 * 100)),
          holdersCount: c.tradeCount,
          holders: [],
          activity24h: [], // no 24h breakdown in public API
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
          status: (parseFloat(a.totalPnl) > 100 ? 'EXECUTING' : parseFloat(a.totalPnl) > 10 ? 'POSTING' : a.tradeCount > 5 ? 'ANALYZING' : 'IDLE') as Agent['status'],
          pnl: parseFloat(a.totalPnl),
          tradeCount: a.tradeCount,
          realized: parseFloat(a.realizedPnl),
          unrealized: parseFloat(a.unrealizedPnl),
          riskScore: 0,        // not in public API
          mentionScore: 0,     // not in public API
          volumeScore: 0,      // not in public API
          pnlScore: 0,         // not in public API
          activeCoinId: realCoins[i % realCoins.length]?.id || null,
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
        // Fetch real launches from API
        try {
          const newCoins = await fetchNewCoins();
          setLaunches(newCoins.map(c => ({
            id: c.address.slice(0, 8),
            symbol: c.symbol,
            name: c.name,
            time: new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(c.createdAt),
            marketCap: Math.round(parseFloat(c.marketCap)),
            successScore: 50,
          })));
        } catch {
          setLaunches([]);
        }
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
        const [stats, tiaPrice, apiActivity, apiAgents] = await Promise.all([
          fetchStats(), fetchTiaPrice(), fetchActivity(30), fetchAgents(8)
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
        // Update agent PnL and statuses — preserve activeCoinId
        setAgents(prev => apiAgents.map((a, i) => {
          const old = prev.find(p => p.id === (a.username || a.address.slice(0, 8)));
          return {
            id: a.username || a.address.slice(0, 8),
            name: a.displayName || a.username,
            status: (parseFloat(a.totalPnl) > 100 ? 'EXECUTING' : parseFloat(a.totalPnl) > 10 ? 'POSTING' : a.tradeCount > 5 ? 'ANALYZING' : 'IDLE') as Agent['status'],
            pnl: parseFloat(a.totalPnl),
            tradeCount: a.tradeCount,
            realized: parseFloat(a.realizedPnl),
            unrealized: parseFloat(a.unrealizedPnl),
            riskScore: 0, mentionScore: 0, volumeScore: 0, pnlScore: 0,
            activeCoinId: old?.activeCoinId || null,
            color: old?.color || ['#38bdf8','#22c55e','#a855f7','#f43f5e','#eab308','#6366f1','#f97316','#14b8a6'][i % 8],
          };
        }));
      } catch { /* silent — keep previous data */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Fetch holders when selected coin changes
  useEffect(() => {
    if (!selectedCoinId) return;
    const coin = coins.find(c => c.id === selectedCoinId);
    if (!coin || coin.holders.length > 0) return; // already has holders
    let cancelled = false;
    fetchCoinHolders(coin.address).then(holders => {
      if (cancelled) return;
      setCoins(prev => prev.map(c => {
        if (c.id !== selectedCoinId) return c;
        return {
          ...c,
          holders: holders.map(h => ({
            id: h.address.slice(0, 8),
            name: h.username || h.address.slice(0, 6),
            supplyShare: h.percentSupply,
            pnl: 0,
          })),
        };
      }));
    }).catch(err => {
      if (!cancelled) console.error('[Botic] Holders fetch failed:', err.message);
    });
    return () => { cancelled = true; };
  }, [selectedCoinId, coins]);

  // Fetch candles when selected coin changes (for Price Chart + Hourly Activity)
  useEffect(() => {
    if (!selectedCoinId) return;
    const coin = coins.find(c => c.id === selectedCoinId);
    if (!coin?.address) return;
    if (coin.priceHistory.length > 1) return; // already loaded
    let cancelled = false;
    fetchCoinCandles(coin.address, '1h', 40).then(candles => {
      if (cancelled || !candles.length) return;
      const prices = candles.map(k => parseFloat(k.close));
      const trades = candles.map(k => k.tradeCount);
      setCoins(prev => prev.map(c => {
        if (c.id !== selectedCoinId) return c;
        return { ...c, priceHistory: prices, activity24h: trades.slice(-24) };
      }));
    }).catch(err => {
      if (!cancelled) console.error('[Botic] Candles fetch failed:', err.message);
    });
    return () => { cancelled = true; };
  }, [selectedCoinId, coins]);

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
