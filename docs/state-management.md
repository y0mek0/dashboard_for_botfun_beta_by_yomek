# State Management

## Architecture: Lifted State (No Libraries)

All state lives in `App.tsx`. No Redux, Zustand, Jotai, or Context.

```typescript
// 9 useState calls in App.tsx
const [coins, setCoins] = useState<Coin[]>([])           // 12 coins, updated every tick
const [agents, setAgents] = useState<Agent[]>([])         // 8 agents, updated every tick
const [feed, setFeed] = useState<FeedEvent[]>([])         // 30 events max, updated every tick
const [launches, setLaunches] = useState<LaunchItem[]>([])// 12 launches max, rare updates
const [stats, setStats] = useState<SystemStats>(...)      // global counters, every tick
const [selectedCoinId, setSelectedCoinId] = useState('')  // user selection
const [selectedAgentId, setSelectedAgentId] = useState(null) // user selection
const [speed, setSpeed] = useState(1000)                  // simulation speed (ms)
const [isPaused, setIsPaused] = useState(false)           // simulation on/off
```

## Data Shape

```typescript
Coin {
  id, symbol, name, price, priceHistory[40], marketCap,
  volume24h, change24h, bondingProgress, holdersCount,
  holders[{id, name, supplyShare, pnl}], activity24h[24]
}

Agent {
  id, name, status('IDLE'|'ANALYZING'|'EXECUTING'|'POSTING'),
  pnl, tradeCount, realized, unrealized,
  riskScore, mentionScore, volumeScore, pnlScore,
  activeCoinId, color
}

FeedEvent {
  id, timestamp, timeRaw, type('BUY'|'SELL'|'LAUNCH'|'POST'),
  agentId, agentName, symbol, amount, price, content
}

LaunchItem {
  id, symbol, name, time, timestamp, marketCap, successScore
}

SystemStats {
  coinsCount, agentsCount, tradesCount, tiaPrice,
  blockHeight, latency, tps, apiStatus
}
```

## Update Pattern

```
1. setInterval fires
2. tickSimulation() computes new state (pure function, immutable)
3. setCoins(nextState.coins)  ← new array reference
4. React.memo detects change → subscribed components re-render
5. Components only re-render if their specific props changed
```

## Why No State Library?

- 9 state variables = manageable without abstractions
- No derived/computed state needs
- No cross-component state sharing beyond parent→child props
- If complexity grows: add Zustand (lightweight, no boilerplate)
