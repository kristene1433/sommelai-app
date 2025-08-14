// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Lightweight test endpoint
router.get('/test', async (req, res) => {
  try {
    const endpoint = process.env.HUGGINGFACE_ENDPOINT_URL;
    if (!endpoint) return res.status(500).json({ error: 'HUGGINGFACE_ENDPOINT_URL not set' });

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: 'Hello from backend test' }),
    });

    const text = await resp.text();
    try {
      const json = JSON.parse(text);
      return res.status(resp.status).json({ ok: resp.ok, data: json });
    } catch (e) {
      return res.status(resp.status).send(text);
    }
  } catch (err) {
    console.error('[chat/test] error', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper: call HF endpoint trying two shapes, then OpenAI fallback
async function callHfWithFallback(endpoint, apiKey, prompt, openaiModelName = 'openai/gpt-oss-20b') {
  // 1) Try HF "inputs" format
  try {
    let resp = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 500, temperature: 0.7 } }),
    });

    let text = await resp.text().catch(() => null);
    if (resp.ok) {
      // return parsed if possible
      try { return { ok: true, body: JSON.parse(text) }; } catch (e) { return { ok: true, body: text }; }
    }

    // Not ok — log & try messages shape
    console.error('[HF] inputs format failed', resp.status, text);

    // 2) Try OpenAI-compatible "messages" shape
    resp = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: openaiModelName,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    text = await resp.text().catch(() => null);
    if (resp.ok) {
      try { return { ok: true, body: JSON.parse(text) }; } catch (e) { return { ok: true, body: text }; }
    }

    // both HF attempts failed
    return { ok: false, status: resp.status, body: text || 'No body from HF' };
  } catch (err) {
    console.error('[callHfWithFallback] error', err);
    return { ok: false, status: 500, body: err.message || String(err) };
  }
}

// helper: call OpenAI Chat Completions as fallback
async function callOpenAI(prompt) {
  try {
    if (!process.env.OPENAI_API_KEY) return null;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const oResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
    if (!oResp.ok) {
      const txt = await oResp.text().catch(() => null);
      console.error('[callOpenAI] non-ok', oResp.status, txt);
      return null;
    }
    const j = await oResp.json();
    const text =
      j?.choices?.[0]?.message?.content ||
      j?.choices?.[0]?.text ||
      j?.output?.[0]?.content?.[0]?.text ||
      j?.output_text;
    return text ? String(text).trim() : null;
  } catch (e) {
    console.error('[callOpenAI] error', e);
    return null;
  }
}

// /somm: text-based chat
router.post('/somm', async (req, res) => {
  try {
    const { messages, usePreferences, preferences } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Build system prompt with preferences
    let systemPrompt = 'You are a master sommelier and friendly conversationalist. ' +
      'The conversation is about a specific wine identified earlier. ' +
      'For every follow-up question, answer as if referring to that wine unless the user explicitly changes topic.\n';

    if (usePreferences && preferences) {
      systemPrompt += `USER PREFERENCES:\n- Wine Types: ${preferences.wineTypes?.join(', ') || 'any'}\n- Flavor Profiles: ${preferences.flavorProfiles?.join(', ') || 'any'}\n`;
    } else {
      systemPrompt += 'USER PREFERENCES: None provided.\n';
    }
    systemPrompt += 'End with a question to keep chat going. No markdown. No numbered lists.';

    // Flatten messages to single prompt text
    const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];
    const prompt = fullMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    const hfEndpoint = process.env.HUGGINGFACE_ENDPOINT_URL;
    if (!hfEndpoint || !/^https?:\/\//i.test(hfEndpoint)) {
      console.error('[chat] HUGGINGFACE_ENDPOINT_URL missing or invalid:', hfEndpoint);
      return res.status(500).json({
        error: 'Server misconfiguration: HUGGINGFACE_ENDPOINT_URL must be set to a full absolute URL (https://...)'
      });
    }

    // Call HF with fallback attempts
    const hfResult = await callHfWithFallback(hfEndpoint, process.env.HUGGINGFACE_API_KEY || '', prompt, 'openai/gpt-oss-20b');

    if (hfResult.ok) {
      // normalize many possible response shapes
      const ai = hfResult.body;
      // handle array or object shapes
      let generated =
        (Array.isArray(ai) && (ai[0]?.generated_text || ai[0]?.text || ai[0]?.output_text)) ||
        ai?.generated_text ||
        ai?.text ||
        ai?.output_text ||
        (typeof ai === 'string' && ai);

      // Sometimes OpenAI-compatible endpoints return choices/output_text
      if (!generated && ai?.choices?.[0]?.message?.content) {
        generated = ai.choices[0].message.content;
      }
      if (!generated && ai?.choices?.[0]?.text) {
        generated = ai.choices[0].text;
      }

      if (generated && String(generated).trim().length) {
        return res.json({ answer: String(generated).trim() });
      }
      // If HF succeeded but no text found, try OpenAI fallback
    } else {
      console.error('[chat] HF failed:', hfResult.status, hfResult.body);
    }

    // Final fallback: OpenAI (if configured)
    if (process.env.OPENAI_API_KEY) {
      const openaiAnswer = await callOpenAI(prompt);
      if (openaiAnswer) return res.json({ answer: openaiAnswer });
    }

    // No answer generated
    if (hfResult && !hfResult.ok) {
      return res.status(502).json({ error: `Hugging Face error: ${hfResult.status} ${hfResult.body}` });
    }

    return res.status(500).json({ error: 'No answer generated' });
  } catch (err) {
    console.error('[chat] error:', err);
    res.status(500).json({ error: err.stack || err.message || 'Chat error' });
  }
});

module.exports = router;
