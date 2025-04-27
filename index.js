// /api/index.js

export default async function handler(req, res) {
  const { query } = req;
  const targetUrl = process.env.TARGET_URL;

  if (!targetUrl) {
    return res.status(500).json({ success: false, error: 'TARGET_URL not configured' });
  }

  try {
    const url = new URL(targetUrl);

    // Передаем все query-параметры из запроса клиента
    Object.keys(query).forEach(key => {
      url.searchParams.append(key, query[key]);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(200).json(data);
    } else {
      const text = await response.text();
      res.status(200).send(text);
    }

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ success: false, error: error.toString() });
  }
}
