# Component Dependency Map

```
App.tsx
├── imports simulation.ts
│   ├── getInitialCoins()
│   ├── getInitialAgents()
│   ├── getInitialFeed()
│   ├── getInitialLaunches()
│   ├── getInitialStats()
│   └── tickSimulation()
│
├── imports types.ts
│   ├── Coin
│   ├── Agent
│   ├── FeedEvent
│   ├── LaunchItem
│   └── SystemStats
│
├── imports TerminalPanel (local, within App.tsx)
│   └── adds HUD corner markers + panel styling
│
└── renders components:
    ├── Header          ← stats, speed, setSpeed, isPaused, setIsPaused
    ├── EcosystemMap    ← coins[], agents[], selectedCoinId, onSelectCoin, lastTriggeredEvent
    ├── LiveFeed        ← feed[], onSelectCoin
    ├── PriceChart      ← selectedCoin (React.memo)
    ├── AgentMetrics    ← agents[], selectedAgentId (React.memo)
    ├── Leaderboard     ← agents[], selectedAgentId, onSelectAgent (React.memo)
    ├── HolderTreemap   ← selectedCoin (React.memo)
    ├── ActivityHeatmap ← coins[], selectedCoinId, onSelectCoin (React.memo)
    ├── LaunchTimeline  ← launches[], onSelectCoin (React.memo)
    └── BottomTicker    ← coins[], onSelectCoin (React.memo)

External deps:
    react, react-dom, lucide-react, tailwindcss
```

## Interaction Chains

```
User clicks coin in Heatmap/LiveFeed/Ecosystem/Leader line/Ticker
    → setSelectedCoinId(id)
        → App re-renders
            → PriceChart: new selectedCoin → canvas redraws
            → HolderTreemap: new selectedCoin → treemap updates
            → EcosystemMap: selectedCoinId changes → selection ring draws

User clicks agent in Leaderboard
    → setSelectedAgentId(id)
        → App re-renders
            → Leaderboard: selected row highlights
            → AgentMetrics: only re-renders if props change (they don't — memoized)

User clicks Pause
    → setIsPaused(true)
        → setInterval in App stops

User changes FREQ dropdown
    → setSpeed(value)
        → clearInterval, new setInterval with new speed
```

## Data Dependency Graph

```
coins ──────┬── EcosystemMap (all)
            ├── PriceChart (selected only)
            ├── HolderTreemap (selected only)
            ├── ActivityHeatmap (all, 10 displayed)
            ├── BottomTicker (all)
            └── LaunchTimeline (indirect — via launches)

agents ─────┬── EcosystemMap (all)
            ├── AgentMetrics (all)
            └── Leaderboard (all)

feed ─────── LiveFeed

launches ─── LaunchTimeline

stats ────── Header
```
