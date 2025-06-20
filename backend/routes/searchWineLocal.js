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
    /* ---- Call OpenAI web-search model ---------------------- */
    const gptResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method : 'POST',
      headers: {
        Authorization : `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-search-preview',
        web_search_options: {
          user_location: { type:'approximate', approximate:{ country:'US' } },
          search_context_size: 'low',
        },
        messages: [
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
    console.log('🔎 GPT raw:', JSON.stringify(gpt, null, 2));

    /* ---- Build results ------------------------------------ */
    let results = [];

    /* 1️⃣ Try to parse JSON directly from message.content */
    try {
      const parsed = JSON.parse(gpt.choices?.[0]?.message?.content || '{}');
      results = parsed.results || [];

      /* Attach URLs from annotations (they appear in order) */
      const annots = gpt.choices?.[0]?.message?.annotations || [];
      annots
        .filter(a => a.type === 'url_citation')
        .forEach((a, idx) => {
          if (results[idx]) results[idx].url = a.url_citation.url;
        });

    } catch {
      /* 2️⃣ Fallback: parse bullet blocks + add URLs by index */
      const text   = gpt.choices?.[0]?.message?.content || '';
      const urls   = (gpt.choices?.[0]?.message?.annotations || [])
        .filter(a => a.type === 'url_citation')
        .map(a => a.url_citation.url);

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

