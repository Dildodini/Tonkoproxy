import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const targetUrl = process.env.TARGET_URL;

  if (!targetUrl) {
    return res.status(500).json({ success: false, error: 'TARGET_URL is not defined' });
  }

  try {
    const url = new URL(targetUrl);
    for (const key in req.query) {
      url.searchParams.append(key, String(req.query[key]));
    }

    const response = await fetch(url.toString(), {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}