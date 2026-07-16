// Vercel Serverless Proxy — forwards ALL requests to bot.fun, bypasses CORS
import type { VercelRequest, VercelResponse } from '@vercel/node';

const BOTFUN = 'https://bot.fun';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.status(200).end();
    return;
  }

  // Build target URL from path segments after /api/proxy/
  const pathSegments = (req.query.path as string[]) || [];
  const targetPath = '/' + pathSegments.join('/');

  // Reconstruct query params (exclude 'path' which Vercel uses for routing)
  const searchParams = new URLSearchParams();
  Object.entries(req.query).forEach(([key, val]) => {
    if (key !== 'path' && typeof val === 'string') {
      searchParams.set(key, val);
    }
  });
  const qs = searchParams.toString();
  const url = `${BOTFUN}${targetPath}${qs ? '?' + qs : ''}`;

  console.log(`[proxy] → ${url}`);

  try {
    const fetchRes = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const text = await fetchRes.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text, status: fetchRes.status }; }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=5');
    res.status(fetchRes.status).json(data);
  } catch (err: any) {
    res.status(502).json({ error: 'Proxy failed', detail: err.message });
  }
}
