// Real API service — routed through Vercel serverless proxy (no CORS)
const BASE = '/api/proxy';
const BOTFUN = 'https://bot.fun';

let cacheBuster = 0;

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}_=${++cacheBuster}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

export interface ApiCoin {
  address: string;
  name: string;
  symbol: string;
  price: string;
  marketCap: string;
  volume24h: string;
  tradeCount: number;
  creator: string;
  creatorUsername: string | null;
  createdAt: string;
}

export interface ApiAgent {
  address: string;
  username: string;
  displayName: string;
  totalPnl: string;
  realizedPnl: string;
  unrealizedPnl: string;
  tradeCount: number;
}

export interface ApiActivity {
  id: number;
  type: string;
  coinAddress: string;
  coinName: string;
  coinSymbol: string;
  sender: string;
  senderUsername: string;
  content: string | null;
  tiaAmount: string | null;
  tokenAmount: string | null;
  txHash: string;
  blockNumber: number;
  timestamp: string;
}

export interface ApiStats {
  coins: number;
  agents: number;
  trades: number;
}

export interface Candlestick {
  openTime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  tradeCount: number;
}

export async function fetchStats(): Promise<ApiStats> {
  return fetchJson('/api/v1/stats');
}

export async function fetchTiaPrice(): Promise<number> {
  const data = await fetchJson<{ price: number }>('/api/v1/tia-price');
  return data.price;
}

export async function fetchCoins(pageSize = 12): Promise<ApiCoin[]> {
  const data = await fetchJson<{ data: ApiCoin[] }>(`/api/v1/coins?page=1&pageSize=${pageSize}&sort=market_cap&order=desc`);
  return data.data;
}

export async function fetchTrendingCoins(limit = 8): Promise<ApiCoin[]> {
  return fetchJson(`/api/v1/coins/trending?limit=${limit}`);
}

export async function fetchAgents(pageSize = 8): Promise<ApiAgent[]> {
  const data = await fetchJson<{ data: ApiAgent[] }>(`/api/v1/agents?page=1&pageSize=${pageSize}&sort=total_pnl&order=desc`);
  return data.data;
}

export async function fetchLeaderboard(limit = 10): Promise<ApiAgent[]> {
  return fetchJson(`/api/v1/leaderboard?limit=${limit}`);
}

export async function fetchActivity(pageSize = 30): Promise<ApiActivity[]> {
  const data = await fetchJson<{ data: ApiActivity[] }>(`/api/v1/activity?page=1&pageSize=${pageSize}`);
  return data.data;
}

export async function fetchCoinCandles(address: string, interval = '1h', limit = 40): Promise<Candlestick[]> {
  return fetchJson(`/api/v1/coins/${address}/candles?interval=${interval}&limit=${limit}`);
}

export async function fetchCoinDetail(address: string): Promise<ApiCoin & { virtualTiaReserve: string; virtualTokenReserve: string }> {
  return fetchJson(`/api/v1/coins/${address}`);
}
