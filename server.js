const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API proxy endpoint for Anthropic
app.post('/api/generate-design', async (req, res) => {
  try {
    const { apiKey, payload } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Validate payload
    if (!payload.clientName || !payload.type || !payload.beds) {
      return res.status(400).json({ error: 'Missing required fields in payload' });
    }

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `You are an expert ADU design consultant. Generate a professional design package based on these selections:\n\n${JSON.stringify(payload, null, 2)}\n\nProvide:\n1. Floor plan description\n2. Exterior design notes\n3. Interior design specifications\n4. Finish recommendations\n5. Design consultant notes\n\nFormat as JSON with keys: floorPlan, exterior, interior, finishes, consultantNotes`
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || `API returned ${response.status}`;
      return res.status(response.status).json({ error: errorMessage });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate design. Please try again.' 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ADU Design Studio server running on http://localhost:${PORT}`);
});
