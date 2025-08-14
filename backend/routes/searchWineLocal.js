// routes/searchWineLocal.js  (CommonJS)
const express = require('express');
const router  = express.Router();
require('dotenv').config();

/* ----------------------------------------------------------- */
router.post('/searchWineLocal', async (req, res) => {
  const { query, zip } = req.body;
  if (!query || !zip) {
    return res.status(400).json({ message: 'zip and query required' });
  }

  try {
    /* ---- Call OpenAI GPT-5 mini model ---------------------- */
    const gptResp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        input: [
          {
            role: 'system',
            content: 'You are a wine expert helping find local wine stores. Return ONLY valid JSON matching {"results":[{name,price,store,address,url}]}. No markdown, prose, or extra keys. Choose retailers physically located within 25 miles of the ZIP code. Do NOT list generic online shops unless none are local.'
          },
          {
            role: 'user',
            content: `Find three stores near ZIP ${zip} that sell ${query}.`
          }
        ],
      }),
    });

    const gpt = await gptResp.json();
    console.log('🔎 GPT-5 mini raw:', JSON.stringify(gpt, null, 2));

    /* ---- Build results ------------------------------------ */
    let results = [];

    /* 1️⃣ Try to parse JSON directly from output_text */
    try {
      const content = gpt.output_text || '';
      const parsed = JSON.parse(content);
      results = parsed.results || [];

      /* Note: OpenAI GPT-5 mini provides structured responses, so we can parse from text */
    } catch {
      /* 2️⃣ Fallback: parse bullet blocks from generated text */
      const text = gpt.output_text || '';

      const blocks = text.split(/\n{2,}/).slice(0, 3);
      results = blocks.map((b, i) => {
        const lines = b.split('\n');
        const first = lines[0] || '';
        const m = first.match(/^(.*?)[–-]\s*\$?([\d.]+)\s*at\s*(.*)$/i);
        return {
          name   : m ? m[1].trim() : first.trim(),
          price  : m ? m[2]        : '?',
          store  : m ? m[3].trim() : '',
          address: lines[1]?.trim() || '',
          url    : lines.find(l => /^https?:\/\//i.test(l))?.trim() || '',
        };
      });
    }

    return res.json({ results });
  } catch (err) {
    console.error('searchWineLocal error:', err);
    return res.status(500).json({ message: 'Search failed.' });
  }
});
/* ----------------------------------------------------------- */

module.exports = router;

