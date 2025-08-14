// backend/routes/vision.js
const express  = require('express');
const multer   = require('multer')(); // in-memory
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fetch    = require('node-fetch');

const router = express.Router();
const s3     = new S3Client({ region: process.env.AWS_REGION });

const validMime = /^(image\/jpeg|image\/png)$/i;
const maxBytes  = 4 * 1024 * 1024; // 4 MB

function slugify(str = '') {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// Helper: call HF endpoint trying two shapes
async function callHfEndpoint(endpointUrl, apiKey, messages, modelName = 'openai/gpt-oss-20b') {
  try {
    // 1) Try HF "inputs" payload (some endpoints accept structured inputs)
    let resp = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: messages,
        parameters: { max_new_tokens: 500, temperature: 0.7, do_sample: true }
      }),
      timeout: 120000
    });

    let text = await resp.text().catch(() => null);
    if (resp.ok) {
      try { return { ok: true, body: JSON.parse(text) }; } catch (e) { return { ok: true, body: text }; }
    }

    console.error('[vision] HF inputs payload failed', resp.status, text);

    // 2) Try OpenAI-compatible messages payload
    resp = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        max_tokens: 500,
        temperature: 0.7
      }),
      timeout: 120000
    });

    text = await resp.text().catch(() => null);
    if (resp.ok) {
      try { return { ok: true, body: JSON.parse(text) }; } catch (e) { return { ok: true, body: text }; }
    }

    console.error('[vision] HF messages payload failed', resp.status, text);
    return { ok: false, status: resp.status, body: text || 'No body from HF' };
  } catch (err) {
    console.error('[vision] callHfEndpoint error', err);
    return { ok: false, status: 500, body: err.message || String(err) };
  }
}

// Helper: fallback to OpenAI (textual prompt including image URL)
async function callOpenAIVisionFallback(imageUrl, userQuestion, previousWineDescription = null) {
  try {
    if (!process.env.OPENAI_API_KEY) return null;
    // Build a text prompt including the image URL and any previous description
    let system = 'You are a master sommelier and visual expert. Analyze the image linked by the user and answer the question.';
    let userPrompt = `Image URL: ${imageUrl}\nQuestion: ${userQuestion}`;
    if (previousWineDescription) userPrompt = `Previous context: ${previousWineDescription}\n\n` + userPrompt;

    // Use OpenAI chat completions endpoint
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
      timeout: 120000
    });

    if (!resp.ok) {
      const t = await resp.text().catch(() => null);
      console.error('[vision] OpenAI non-ok', resp.status, t);
      return null;
    }

    const j = await resp.json();
    const text =
      j?.choices?.[0]?.message?.content ||
      j?.choices?.[0]?.text ||
      j?.output_text;
    return text ? String(text).trim() : null;
  } catch (e) {
    console.error('[vision] callOpenAIVisionFallback error', e);
    return null;
  }
}

/* ---- MAIN ROUTE ---- */
router.post('/somm', multer.single('photo'), async (req, res) => {
  try {
    // 1) Validate upload
    if (!req.file) {
      console.error('[vision] No file');
      return res.status(400).json({ error: 'No “photo” file' });
    }
    if (!validMime.test(req.file.mimetype)) {
      console.error('[vision] Invalid MIME:', req.file.mimetype);
      return res.status(400).json({ error: 'JPEG or PNG only' });
    }
    if (req.file.size > maxBytes) {
      console.error('[vision] File too large:', req.file.size);
      return res.status(400).json({ error: 'Max size 4 MB' });
    }

    // 2) Upload to S3
    const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
    const key = `wine/${Date.now()}-${slugify(req.file.originalname)}.${ext}`;
    console.log('[vision] Uploading to S3:', key);

    await s3.send(new PutObjectCommand({
      Bucket     : process.env.BUCKET,
      Key        : key,
      Body       : req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    // 3) Presigned URL
    const imageUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: process.env.BUCKET, Key: key }),
      { expiresIn: 900 } // 15 min
    );
    console.log('[vision] Got signed URL:', imageUrl);

    // 4) Get question & previousWineDescription from form-data
    const userQuestion =
      (req.body && req.body.question && req.body.question.trim())
        ? req.body.question.trim()
        : 'Suggest wine style and food pairing:';

    const previousWineDescription =
      (req.body && req.body.previousWineDescription && req.body.previousWineDescription.trim())
        ? req.body.previousWineDescription.trim()
        : null;

    // 5) Build messages for HF/OpenAI shapes
    const messages = [];

    messages.push({
      role: 'system',
      content:
        'You are a master sommelier and visual expert. ' +
        'Analyze the image of the wine or menu provided and answer the user question. ' +
        'If previous wine context is provided, use it to inform your answers and keep conversation consistent. ' +
        'Do NOT guess if unsure; ask for clarification politely.',
    });

    if (previousWineDescription) {
      messages.push({
        role: 'assistant',
        content: previousWineDescription,
      });
    }

    // Use structured content so both HF inputs & OpenAI-style messages can work
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: userQuestion },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    });

    // 6) Call Hugging Face Endpoint (prefer endpoint URL if configured)
    const hfEndpointUrl = process.env.HUGGINGFACE_ENDPOINT_URL?.trim();
    const hfApiKey     = process.env.HUGGINGFACE_API_KEY?.trim();

    if (!hfEndpointUrl || !/^https?:\/\//i.test(hfEndpointUrl)) {
      console.warn('[vision] HUGGINGFACE_ENDPOINT_URL not set or invalid - will try public model endpoint as fallback');
    }

    // If endpoint URL present try it (this is the hosted inference endpoint you created)
    let hfResult = null;
    if (hfEndpointUrl) {
      console.log('[vision] Calling HF endpoint URL:', hfEndpointUrl);
      hfResult = await callHfEndpoint(hfEndpointUrl, hfApiKey, messages, 'openai/gpt-oss-20b');
    } else {
      // Fall back to public model inference (less preferred)
      const publicModelUrl = 'https://api-inference.huggingface.co/models/openai/gpt-oss-20b';
      console.log('[vision] Calling HF public model API:', publicModelUrl);
      hfResult = await callHfEndpoint(publicModelUrl, hfApiKey, messages, 'openai/gpt-oss-20b');
    }

    // 7) Interpret HF response
    if (hfResult && hfResult.ok) {
      const ai = hfResult.body;
      // possible shapes: array with generated_text, object with generated_text, or OpenAI-like choices
      let answer =
        (Array.isArray(ai) && (ai[0]?.generated_text || ai[0]?.text || ai[0]?.output_text)) ||
        ai?.generated_text ||
        ai?.text ||
        ai?.output_text ||
        (typeof ai === 'string' && ai);

      if (!answer && ai?.choices?.[0]?.message?.content) {
        answer = ai.choices[0].message.content;
      }
      if (!answer && ai?.choices?.[0]?.text) {
        answer = ai.choices[0].text;
      }

      if (answer && String(answer).trim().length) {
        console.log('[vision] HF answer OK');
        return res.json({ answer: String(answer).trim(), imageUrl });
      }

      // HF ok but no usable answer — fall through to OpenAI fallback (if available)
      console.warn('[vision] HF returned OK but no generated text found. Falling back to OpenAI if configured.');
    } else {
      console.error('[vision] HuggingFace returned non-ok or error:', hfResult?.status, hfResult?.body);
      // If HF specifically says endpoint paused or not available, we'll try OpenAI fallback
    }

    // 8) Final fallback: use OpenAI with a textual prompt (if configured)
    if (process.env.OPENAI_API_KEY) {
      console.log('[vision] Using OpenAI fallback to analyze image URL');
      const openaiAnswer = await callOpenAIVisionFallback(imageUrl, userQuestion, previousWineDescription);
      if (openaiAnswer) {
        return res.json({ answer: openaiAnswer, imageUrl });
      }
      console.error('[vision] OpenAI fallback returned no answer.');
    }

    // 9) If we reach here nothing worked
    const hfDebug = hfResult ? `${hfResult.status} ${String(hfResult.body).substring(0, 200)}` : 'No HF result';
    return res.status(502).json({ error: `Vision processing failed. ${hfDebug}` });
  } catch (err) {
    console.error('[vision] error:', err);
    res.status(500).json({ error: err.stack || err.message || 'vision error' });
  }
});

module.exports = router;
