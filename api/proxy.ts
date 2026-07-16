// Vercel proxy — server-side fetch to bot.fun, bypasses CORS
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).end();
  }

  const targetPath = (req.query.path as string) || '';
  if (!targetPath) return res.status(400).json({ error: 'Missing path param' });

  const url = `https://bot.fun${targetPath}`;

  try {
    const fetchRes = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await fetchRes.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=5');
    res.status(fetchRes.status).json(data);
  } catch (err: any) {
    res.status(502).json({ error: 'Proxy error', detail: err.message });
  }
}
