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

    // Optional previous wine context passed in
    const previousWineDescription =
      (req.body && req.body.previousWineDescription && req.body.previousWineDescription.trim())
        ? req.body.previousWineDescription.trim()
        : null;

    // 5) Build messages for GPT-4o Vision
    const messages = [];

    // Add system prompt with instructions
    messages.push({
      role: 'system',
      content:
        'You are a master sommelier and visual expert. ' +
        'Analyze the image of the wine or menu provided and answer the user question. ' +
        'If previous wine context is provided, use it to inform your answers and keep conversation consistent. ' +
        'Do NOT guess if unsure; ask for clarification politely.',
    });

    // If previous wine description exists, provide it as assistant context
    if (previousWineDescription) {
      messages.push({
        role: 'assistant',
        content: previousWineDescription,
      });
    }

    // Add the user message with text and image_url content
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: userQuestion },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    });

    // 6) Call OpenAI GPT-4o Vision
    console.log('[vision] Calling OpenAI...');
    const ai = await fetch('https://api.openai.com/v1/chat/completions', {
      method : 'POST',
      headers: {
        Authorization : `Bearer ${process.env.OPENAI_API_KEY?.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-oss-20b',
        messages,
      }),
    }).then(r => r.json());

    if (!ai.choices) {
      console.error('[vision] OpenAI response:', ai);
      throw new Error('No choices from OpenAI');
    }

    const answer =
      ai.choices?.[0]?.message?.content?.trim() ||
      'Sorry, I could not analyse the image.';

    res.json({ answer, imageUrl });
  } catch (err) {
    console.error('[vision] error:', err);
    res.status(500).json({ error: err.stack || err.message || 'vision error' });
  }
});

module.exports = router;

