// Vercel Serverless Proxy — forwards to bot.fun API, bypasses CORS
import type { VercelRequest, VercelResponse } from '@vercel/node';

const BOTFUN = 'https://bot.fun';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get the target path from the URL
  const path = (req.query.path as string[]) || [];
  const targetPath = '/' + path.join('/');
  
  // Forward query params
  const searchParams = new URLSearchParams();
  Object.entries(req.query).forEach(([key, val]) => {
    if (key !== 'path' && typeof val === 'string') searchParams.set(key, val);
  });
  const qs = searchParams.toString();
  const url = `${BOTFUN}${targetPath}${qs ? '?' + qs : ''}`;

  try {
    const fetchRes = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    const data = await fetchRes.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=5, s-maxage=5');
    res.status(fetchRes.status).json(data);
  } catch (err: any) {
    res.status(502).json({ error: 'Proxy error', detail: err.message });
  }
}
