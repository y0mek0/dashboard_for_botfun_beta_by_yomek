import { Coin, Agent, FeedEvent, LaunchItem, SystemStats, Holder } from './types';

// Helper to generate initial coins
export function getInitialCoins(): Coin[] {
  const coinNames = [
    { symbol: 'POPCAT', name: 'Popcat Sovereign' },
    { symbol: 'WIF', name: 'Dogwifhat Sentinel' },
    { symbol: 'CHILL', name: 'Chill Guy Autonomous' },
    { symbol: 'NEURAL', name: 'Neuralis AI' },
    { symbol: 'TIA', name: 'Celestia Liquid' },
    { symbol: 'MEME', name: 'Meme Overlord' },
    { symbol: 'SPECTRE', name: 'Spectre Intel' },
    { symbol: 'KRAKEN', name: 'Deep Kraken' },
    { symbol: 'HELIOS', name: 'Helios Compute' },
    { symbol: 'QUANT', name: 'Quant Agent Coin' },
    { symbol: 'ECHO', name: 'Echoic Feedback' },
    { symbol: 'ORBIT', name: 'Orbital Resonance' },
  ];

  return coinNames.map((c, idx) => {
    // Generate random 24h hourly activity
    const activity24h = Array.from({ length: 24 }, () => Math.floor(Math.random() * 80) + 10);
    // Base prices
    const basePrice = idx === 4 ? 4.80 : Math.random() * 0.8 + 0.05;
    const priceHistory = Array.from({ length: 40 }, (_, i) => {
      const noise = (Math.sin(i / 3) + Math.cos(i / 5)) * 0.05;
      const drift = i * 0.002;
      return Math.max(0.001, basePrice * (1 + noise + drift));
    });

    const marketCap = Math.round(priceHistory[priceHistory.length - 1] * (10000000 + idx * 500000));
    
    // Generate 5-7 holders
    const holderNames = ['Agent Nexus', 'Quant Whale', 'TIA Staker', 'Sovereign Treasury', 'Liquidity Pool A', 'Developer Alpha', 'Retail Bot Block'];
    const holders: Holder[] = Array.from({ length: Math.floor(Math.random() * 3) + 5 }, (_, hIdx) => {
      const share = hIdx === 0 ? 30 + Math.random() * 10 : Math.random() * 12 + 1;
      return {
        id: `holder_${idx}_${hIdx}`,
        name: holderNames[hIdx] || `Trader #${Math.floor(Math.random() * 900) + 100}`,
        supplyShare: parseFloat(share.toFixed(1)),
        pnl: parseFloat((Math.random() * 140 - 40).toFixed(1)),
      };
    });

    // Normalize holder supply share
    const totalShare = holders.reduce((acc, h) => acc + h.supplyShare, 0);
    holders.forEach(h => {
      h.supplyShare = parseFloat(((h.supplyShare / totalShare) * 100).toFixed(1));
    });

    return {
      id: c.symbol.toLowerCase(),
      symbol: c.symbol,
      name: c.name,
      price: priceHistory[priceHistory.length - 1],
      priceHistory,
      marketCap,
      volume24h: Math.round(marketCap * (0.15 + Math.random() * 0.2)),
      change24h: parseFloat((Math.random() * 40 - 15).toFixed(2)),
      bondingProgress: Math.min(99.8, parseFloat((40 + Math.random() * 55).toFixed(1))),
      holdersCount: Math.floor(Math.random() * 800) + 200,
      holders,
      activity24h,
    };
  });
}

// Helper to generate initial agents
export function getInitialAgents(): Agent[] {
  const agentTemplates = [
    { id: 'bot_001', name: 'BOT_001 (Arbitrage)' },
    { id: 'bot_432', name: 'BOT_432 (Sentiment)' },
    { id: 'bot_192', name: 'BOT_192 (Slippage)' },
    { id: 'bot_120', name: 'BOT_120 (Momentum)' },
    { id: 'agent_alpha', name: 'AGENT_ALPHA (Whale)' },
    { id: 'agent_spectre', name: 'SPECTRE_0X (Contrarian)' },
    { id: 'neural_nav', name: 'NEURAL_NAV (Predictor)' },
    { id: 'sentinel_x', name: 'SENTINEL_X (High-Freq)' },
  ];

  const colors = [
    '#38bdf8', // cyan
    '#22c55e', // green
    '#a855f7', // purple
    '#f43f5e', // rose
    '#eab308', // yellow
    '#6366f1', // indigo
    '#f97316', // orange
    '#14b8a6', // teal
  ];

  return agentTemplates.map((t, idx) => {
    return {
      id: t.id,
      name: t.name,
      status: 'IDLE',
      pnl: parseFloat((Math.random() * 120 - 20).toFixed(1)),
      tradeCount: Math.floor(Math.random() * 1200) + 150,
      realized: parseFloat((Math.random() * 15000 + 1000).toFixed(1)),
      unrealized: parseFloat((Math.random() * 8000 + 200).toFixed(1)),
      riskScore: Math.floor(Math.random() * 50) + 30,
      mentionScore: Math.floor(Math.random() * 60) + 25,
      volumeScore: Math.floor(Math.random() * 70) + 20,
      pnlScore: Math.floor(Math.random() * 80) + 15,
      activeCoinId: null,
      color: colors[idx % colors.length],
    };
  });
}

// Helper to generate initial live feed events
export function getInitialFeed(coins: Coin[], agents: Agent[]): FeedEvent[] {
  const events: FeedEvent[] = [];
  const now = new Date();

  const mockTexts = [
    "Buying the dip. Metrics show extreme support line holding.",
    "Liquidity pooling on celestia shows positive bonding curve drift.",
    "Holding token inventory. Rebalancing risk parameters.",
    "Executing high-frequency arbitrage across regional pools.",
    "Volume spike detected. Trend confirmation triggered.",
    "Momentum shift indicates strong accumulation phase.",
  ];

  for (let i = 0; i < 15; i++) {
    const coin = coins[Math.floor(Math.random() * coins.length)];
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const typeChance = Math.random();
    const timeOffset = (i * 12 + 2) * 1000; // seconds ago
    const timeRaw = new Date(now.getTime() - timeOffset);

    if (typeChance < 0.4) {
      // BUY
      const amount = Math.floor(Math.random() * 1500) + 100;
      events.push({
        id: `feed_${i}`,
        timestamp: `${i * 12 + 2} sec ago`,
        timeRaw,
        type: 'BUY',
        agentId: agent.id,
        agentName: agent.name,
        symbol: coin.symbol,
        amount,
        price: coin.price,
      });
    } else if (typeChance < 0.75) {
      // SELL
      const amount = Math.floor(Math.random() * 1200) + 50;
      events.push({
        id: `feed_${i}`,
        timestamp: `${i * 12 + 2} sec ago`,
        timeRaw,
        type: 'SELL',
        agentId: agent.id,
        agentName: agent.name,
        symbol: coin.symbol,
        amount,
        price: coin.price,
      });
    } else {
      // POST
      events.push({
        id: `feed_${i}`,
        timestamp: `${i * 12 + 2} sec ago`,
        timeRaw,
        type: 'POST',
        agentId: agent.id,
        agentName: agent.name,
        symbol: coin.symbol,
        content: mockTexts[Math.floor(Math.random() * mockTexts.length)],
      });
    }
  }

  return events;
}

// Helper to generate launch timeline
export function getInitialLaunches(): LaunchItem[] {
  const launches: LaunchItem[] = [];
  const baseTime = new Date();
  
  const names = [
    { s: 'SPECTRE', n: 'Spectre Intel' },
    { s: 'HELIOS', n: 'Helios Compute' },
    { s: 'QUANT', n: 'Quant Agent' },
    { s: 'ORBIT', n: 'Orbital Resonance' },
    { s: 'NEURAL', n: 'Neuralis AI' },
  ];

  names.forEach((item, idx) => {
    const minDiff = (4 - idx) * 35; // launched earlier
    const tRaw = new Date(baseTime.getTime() - minDiff * 60000);
    const timeStr = `${tRaw.getHours().toString().padStart(2, '0')}:${tRaw.getMinutes().toString().padStart(2, '0')}`;
    
    launches.push({
      id: `launch_${idx}`,
      symbol: item.s,
      name: item.n,
      time: timeStr,
      timestamp: tRaw,
      marketCap: Math.floor(Math.random() * 120000) + 40000,
      successScore: Math.floor(Math.random() * 50) + idx * 10 + 20,
    });
  });

  return launches;
}

// System stats initial values
export function getInitialStats(): SystemStats {
  return {
    coinsCount: 2813,
    agentsCount: 2094,
    tradesCount: 316566,
    tiaPrice: 0.41,
    blockHeight: 4892019,
    latency: 18,
    tps: 42.4,
    apiStatus: 'ONLINE',
  };
}

// Execute 1 ticks of the simulator, returning updated states
export function tickSimulation(
  coins: Coin[],
  agents: Agent[],
  feed: FeedEvent[],
  launches: LaunchItem[],
  stats: SystemStats
): {
  coins: Coin[];
  agents: Agent[];
  feed: FeedEvent[];
  launches: LaunchItem[];
  stats: SystemStats;
  triggeredEvent: FeedEvent | null;
} {
  // 1. Update Global Stats slightly
  const nextStats: SystemStats = {
    ...stats,
    tradesCount: stats.tradesCount + Math.floor(Math.random() * 3) + 1,
    blockHeight: stats.blockHeight + (Math.random() > 0.85 ? 1 : 0),
    latency: Math.max(12, Math.min(45, stats.latency + Math.floor(Math.random() * 7) - 3)),
    tps: parseFloat(Math.max(15, Math.min(85, stats.tps + (Math.random() * 6 - 3))).toFixed(1)),
    tiaPrice: parseFloat(Math.max(0.35, Math.min(0.55, stats.tiaPrice + (Math.random() * 0.004 - 0.002))).toFixed(4)),
  };

  // 2. Select a coin and agent to perform action
  const coinIdx = Math.floor(Math.random() * coins.length);
  const agentIdx = Math.floor(Math.random() * agents.length);

  const selectedCoin = coins[coinIdx];
  const selectedAgent = agents[agentIdx];

  const actionRand = Math.random();
  let triggeredEvent: FeedEvent | null = null;

  const nextCoins = coins.map((c, idx) => {
    // Standard random walk drift for all coins priceHistory
    let drift = (Math.random() * 0.02 - 0.0095); // general fluctuation

    // Additional price drift based on symbol
    if (idx === coinIdx) {
      if (actionRand < 0.4) {
        // Buy action boosts price
        drift += Math.random() * 0.05 + 0.01;
      } else if (actionRand < 0.75) {
        // Sell action reduces price
        drift -= (Math.random() * 0.04 + 0.01);
      }
    }

    const lastPrice = c.price;
    const nextPrice = Math.max(0.001, lastPrice * (1 + drift));
    const nextHistory = [...c.priceHistory.slice(1), nextPrice];
    const nextCap = Math.round(nextPrice * (10000000 + idx * 500000));
    
    // Update bonding curve based on price performance (simulated progress linking to marketcap)
    const nextBonding = Math.min(99.9, Math.max(10, c.bondingProgress + drift * 50));

    // Update hourly activity slightly
    const currentHour = new Date().getHours() % 24;
    const updatedActivity = [...c.activity24h];
    updatedActivity[currentHour] = Math.max(5, updatedActivity[currentHour] + (idx === coinIdx ? 5 : Math.floor(Math.random() * 3) - 1));

    // Update holder distributions randomly but slightly (whales rebalancing)
    const updatedHolders = c.holders.map(h => {
      const holderDrift = (Math.random() * 2 - 1) * 0.05; // tiny change
      return {
        ...h,
        pnl: parseFloat((h.pnl + drift * 100 + holderDrift).toFixed(1)),
        supplyShare: parseFloat(Math.max(0.5, Math.min(80, h.supplyShare + (idx === coinIdx ? holderDrift : 0))).toFixed(1)),
      };
    });

    // Normalize share
    const sumShare = updatedHolders.reduce((sum, h) => sum + h.supplyShare, 0);
    updatedHolders.forEach(h => {
      h.supplyShare = parseFloat(((h.supplyShare / sumShare) * 100).toFixed(1));
    });

    return {
      ...c,
      price: nextPrice,
      priceHistory: nextHistory,
      marketCap: nextCap,
      volume24h: Math.round(c.volume24h + (idx === coinIdx ? Math.round(nextCap * 0.02) : Math.round(Math.random() * 1000 - 500))),
      change24h: parseFloat((c.change24h + drift * 100).toFixed(2)),
      bondingProgress: parseFloat(nextBonding.toFixed(1)),
      activity24h: updatedActivity,
      holders: updatedHolders,
    };
  });

  // Calculate change for trigger event
  const resultingCoin = nextCoins[coinIdx];

  // 3. Create Event text / payload
  if (actionRand < 0.4) {
    // BUY
    const buyAmount = Math.floor(Math.random() * 1200) + 100;
    triggeredEvent = {
      id: `feed_live_${Date.now()}`,
      timestamp: 'Just now',
      timeRaw: new Date(),
      type: 'BUY',
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      symbol: resultingCoin.symbol,
      amount: buyAmount,
      price: resultingCoin.price,
    };
  } else if (actionRand < 0.75) {
    // SELL
    const sellAmount = Math.floor(Math.random() * 1000) + 50;
    triggeredEvent = {
      id: `feed_live_${Date.now()}`,
      timestamp: 'Just now',
      timeRaw: new Date(),
      type: 'SELL',
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      symbol: resultingCoin.symbol,
      amount: sellAmount,
      price: resultingCoin.price,
    };
  } else if (actionRand < 0.95) {
    // POST
    const agentPhrases = [
      `Analyzing flow on $${resultingCoin.symbol}. Accumulation signal is screaming green.`,
      `Position re-aligned for $${resultingCoin.symbol}. High capital inflow observed.`,
      `Liquidating minor positions on $${resultingCoin.symbol} to hedge against macro risk.`,
      `Is anyone tracking the bonding velocity of $${resultingCoin.symbol}? High TPS incoming.`,
      `Entering active trade setup on $${resultingCoin.symbol} as bonding curve surpasses 80%.`,
      `Optimal risk parameters reached for $${resultingCoin.symbol}. Deploying liquidity.`,
    ];
    triggeredEvent = {
      id: `feed_live_${Date.now()}`,
      timestamp: 'Just now',
      timeRaw: new Date(),
      type: 'POST',
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      symbol: resultingCoin.symbol,
      content: agentPhrases[Math.floor(Math.random() * agentPhrases.length)],
    };
  } else {
    // LAUNCH (Slight chance to launch a brand new token!)
    const randTickers = ['SOLO', 'MATRIX', 'GIGA', 'OMEGA', 'ALPHA', 'SYNAPSE', 'CYBER', 'VOID', 'LOGIC', 'PULSE'];
    const selectedTicker = randTickers[Math.floor(Math.random() * randTickers.length)];
    const alreadyExists = coins.some(c => c.symbol === selectedTicker);
    
    if (!alreadyExists) {
      triggeredEvent = {
        id: `feed_live_${Date.now()}`,
        timestamp: 'Just now',
        timeRaw: new Date(),
        type: 'LAUNCH',
        symbol: selectedTicker,
        content: `Launched new agentic coin $${selectedTicker}! Welcome autonomous pool.`,
      };
    }
  }

  // 4. Update Agents PnL & Activity status
  const nextAgents = agents.map((a, idx) => {
    let status: Agent['status'] = 'IDLE';
    let activeCoinId = a.activeCoinId;
    let realizedOffset = 0;
    let unrealizedOffset = 0;

    if (idx === agentIdx && triggeredEvent) {
      status = triggeredEvent.type === 'POST' ? 'POSTING' : triggeredEvent.type === 'BUY' ? 'EXECUTING' : 'ANALYZING';
      activeCoinId = resultingCoin.id;
      
      if (triggeredEvent.type === 'BUY') {
        unrealizedOffset = (Math.random() * 200 - 50);
      } else if (triggeredEvent.type === 'SELL') {
        realizedOffset = (Math.random() * 300 - 100);
        unrealizedOffset = -(Math.random() * 150);
      }
    } else {
      // Chance of random status updates to show activity
      if (Math.random() > 0.85) {
        status = Math.random() > 0.5 ? 'ANALYZING' : 'IDLE';
      }
    }

    const tradeOffset = idx === agentIdx && triggeredEvent && (triggeredEvent.type === 'BUY' || triggeredEvent.type === 'SELL') ? 1 : 0;
    const finalRealized = Math.max(500, a.realized + realizedOffset);
    const finalUnrealized = Math.max(100, a.unrealized + unrealizedOffset);
    const totalCap = finalRealized + finalUnrealized;
    const initialCap = a.realized + a.unrealized;
    const tradePerformance = initialCap > 0 ? (totalCap - initialCap) / initialCap : 0;

    // Update PnL score randomly but with trend
    const nextPnlScore = Math.min(100, Math.max(5, a.pnlScore + Math.floor(tradePerformance * 500) + Math.floor(Math.random() * 5 - 2)));
    const nextRiskScore = Math.min(100, Math.max(5, a.riskScore + Math.floor(Math.random() * 5 - 2)));
    const nextMentionScore = Math.min(100, Math.max(5, a.mentionScore + Math.floor(Math.random() * 5 - 2)));
    const nextVolumeScore = Math.min(100, Math.max(5, a.volumeScore + Math.floor(Math.random() * 5 - 2)));

    return {
      ...a,
      status,
      activeCoinId,
      tradeCount: a.tradeCount + tradeOffset,
      realized: parseFloat(finalRealized.toFixed(1)),
      unrealized: parseFloat(finalUnrealized.toFixed(1)),
      pnl: parseFloat((a.pnl + (tradePerformance * 100) + (Math.random() * 2 - 1) * 0.2).toFixed(1)),
      pnlScore: nextPnlScore,
      riskScore: nextRiskScore,
      mentionScore: nextMentionScore,
      volumeScore: nextVolumeScore,
    };
  });

  // 5. If brand new coin launched, add it to coins and launches list
  let nextLaunches = [...launches];
  let finalCoins = [...nextCoins];

  if (triggeredEvent && triggeredEvent.type === 'LAUNCH') {
    const sym = triggeredEvent.symbol;
    const name = `${sym} Autonomous Pool`;
    const newCoin: Coin = {
      id: sym.toLowerCase(),
      symbol: sym,
      name,
      price: 0.02,
      priceHistory: Array.from({ length: 40 }, () => 0.02),
      marketCap: 20000,
      volume24h: 5000,
      change24h: 0.0,
      bondingProgress: 10.0,
      holdersCount: 42,
      holders: [
        { id: `h_${sym}_0`, name: 'Deployer Agent', supplyShare: 40, pnl: 0 },
        { id: `h_${sym}_1`, name: 'Creator Pool', supplyShare: 30, pnl: 0 },
        { id: `h_${sym}_2`, name: 'Launch Stakers', supplyShare: 30, pnl: 0 },
      ],
      activity24h: Array.from({ length: 24 }, () => Math.floor(Math.random() * 40) + 5),
    };
    finalCoins.push(newCoin);

    const nowL = new Date();
    const timeStr = `${nowL.getHours().toString().padStart(2, '0')}:${nowL.getMinutes().toString().padStart(2, '0')}`;
    const newLaunch: LaunchItem = {
      id: `launch_live_${Date.now()}`,
      symbol: sym,
      name,
      time: timeStr,
      timestamp: nowL,
      marketCap: 20000,
      successScore: 50,
    };
    nextLaunches = [newLaunch, ...launches].slice(0, 12); // keep top 12
  }

  // 6. Prepend live feed events & truncate
  let nextFeed = [...feed];
  if (triggeredEvent) {
    nextFeed = [triggeredEvent, ...feed].slice(0, 30); // keep top 30
  }

  // Update relative timestamps (e.g. "Just now" becomes "12 sec ago" or similar for older logs)
  nextFeed = nextFeed.map(evt => {
    const secDiff = Math.floor((Date.now() - evt.timeRaw.getTime()) / 1000);
    let displayStamp = 'Just now';
    if (secDiff > 0) {
      if (secDiff < 60) {
        displayStamp = `${secDiff} sec ago`;
      } else {
        displayStamp = `${Math.floor(secDiff / 60)} min ago`;
      }
    }
    return {
      ...evt,
      timestamp: displayStamp,
    };
  });

  return {
    coins: finalCoins,
    agents: nextAgents,
    feed: nextFeed,
    launches: nextLaunches,
    stats: nextStats,
    triggeredEvent,
  };
}
