// routes/searchWineLocal.js  (CommonJS)
const express = require('express');
const router  = express.Router();
const fetch   = (...a) => import('node-fetch').then(({ default:f }) => f(...a));
require('dotenv').config();

/* ----------------------------------------------------------- */
router.post('/searchWineLocal', async (req, res) => {
  const { query, zip } = req.body;
  if (!query || !zip) {
    return res.status(400).json({ message: 'zip and query required' });
  }

  try {
    /* ---- Call HuggingFace GPT-OSS-20B model ---------------------- */
    const gptResp = await fetch('https://api-inference.huggingface.co/models/openai/gpt-oss-20b', {
      method : 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY.trim()}`,

        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [
          {
            role: 'system',
            content:
              'Return ONLY valid JSON matching '
            + '{"results":[{name,price,store,address,url}]} . '
            + 'No markdown, prose, or extra keys.'
            + 'Return ONLY valid JSON exactly matching '
            + '{"results":[{name,price,store,address,url}]}. ' 
            + 'Choose retailers physically located within 25 miles of ZIP ' 
            + zip + '. Do NOT list generic online shops unless none are local.',  
          },
          {
            role: 'user',
            content: `Find three stores near ZIP ${zip} that sell ${query}.`,
          },
        ],
      }),
    });

    const gpt = await gptResp.json();
    console.log('🔎 GPT-OSS-20B raw:', JSON.stringify(gpt, null, 2));

    /* ---- Build results ------------------------------------ */
    let results = [];

    /* 1️⃣ Try to parse JSON directly from generated_text */
    try {
      const parsed = JSON.parse(gpt[0]?.generated_text || '{}');
      results = parsed.results || [];

      /* Note: HuggingFace doesn't have annotations like OpenAI, so we'll parse from text */
    } catch {
      /* 2️⃣ Fallback: parse bullet blocks from generated text */
      const text = gpt[0]?.generated_text || '';

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
          url    : urls[i] || lines.find(l => /^https?:\/\//i.test(l))?.trim() || '',
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

