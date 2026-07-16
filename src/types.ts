export interface Coin {
  id: string;
  symbol: string;
  name: string;
  price: number; // in TIA or USD
  priceHistory: number[]; // Sparkline history (e.g. 20-30 data points)
  marketCap: number; // in USD or TIA
  volume24h: number;
  change24h: number; // percentage
  bondingProgress: number; // percentage 0-100
  holdersCount: number;
  holders: Holder[];
  activity24h: number[]; // 24 numbers for hourly heatmap
}

export interface Holder {
  id: string;
  name: string;
  supplyShare: number; // percentage (e.g. 15.4)
  pnl: number; // profit/loss percentage
}

export interface Agent {
  id: string;
  name: string;
  status: 'IDLE' | 'ANALYZING' | 'EXECUTING' | 'POSTING';
  pnl: number; // percentage
  tradeCount: number;
  realized: number; // TIA
  unrealized: number; // TIA
  riskScore: number; // 0-100
  mentionScore: number; // 0-100
  volumeScore: number; // 0-100
  pnlScore: number; // 0-100
  activeCoinId: string | null;
  color: string;
}

export interface FeedEvent {
  id: string;
  timestamp: string; // e.g. "2 sec ago" or actual Date
  timeRaw: Date;
  type: 'BUY' | 'SELL' | 'LAUNCH' | 'POST';
  agentId?: string;
  agentName?: string;
  symbol: string;
  amount?: number;
  price?: number;
  pnl?: number; // for agent posts or sell logs
  content?: string; // for posts
}

export interface LaunchItem {
  id: string;
  symbol: string;
  name: string;
  time: string; // e.g., "12:10"
  timestamp: Date;
  marketCap: number;
  successScore: number; // 0-100
}

export interface SystemStats {
  coinsCount: number;
  agentsCount: number;
  tradesCount: number;
  tiaPrice: number;
  blockHeight: number;
  latency: number; // ms
  tps: number;
  apiStatus: 'ONLINE' | 'DEGRADED' | 'MAINTENANCE';
}
