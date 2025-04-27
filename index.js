import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const TARGET_URL = 'https://script.google.com/macros/s/AKfycbzIXDT_TrHxtIvxpW6X8_jizBVl7lzYEB_NcR8rZqqLzXhz9aXRHTE9aJENJrdrL0MKWQ/exec';

app.all('*', async (req, res) => {
  try {
    const url = new URL(TARGET_URL);
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        url.searchParams.append(key, req.query[key]);
      });
    }

    const response = await fetch(url.toString(), {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    res.set('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

export default app;
