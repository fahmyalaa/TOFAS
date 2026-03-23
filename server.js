const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check — visit /health to confirm server and key are working
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    keyLoaded: !!API_KEY,
    keyPrefix: API_KEY ? API_KEY.substring(0, 16) + '...' : 'NOT SET'
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY environment variable is not set' });
    }

    const { system, messages } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'API error',
        type: data.error?.type || 'unknown'
      });
    }

    res.json({ text: data.content?.[0]?.text || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`TOFAS Prep server running on port ${PORT}`);
  console.log(`API key loaded: ${!!API_KEY}`);
});
