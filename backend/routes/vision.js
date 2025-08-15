// backend/routes/vision.js
const express  = require('express');
const multer   = require('multer')(); // in-memory
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

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
      return res.status(400).json({ error: 'No "photo" file' });
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

    // 5) Build messages for OpenAI GPT-5 mini vision API
    const messages = [];

    // Add system prompt
    messages.push({
      role: 'user',
      content: [
        { 
          type: 'input_text', 
          text: 'You are a master sommelier and visual expert. Analyze the image of the wine or menu provided and answer the user question. If previous wine context is provided, use it to inform your answers and keep conversation consistent. Do NOT guess if unsure; ask for clarification politely. Be knowledgeable, approachable, and charming in your responses.' + 
          (previousWineDescription ? `\n\nPrevious wine context: ${previousWineDescription}` : '') +
          `\n\nQuestion: ${userQuestion}`
        },
        { type: 'input_image', image_url: imageUrl },
      ],
    });

    // 6) Call OpenAI GPT-5 mini for vision analysis
    console.log('[vision] Calling OpenAI GPT-5 mini for image analysis...');
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const ai = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY?.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        input: messages,
      }),
    }).then(r => r.json());

    if (!ai || ai.error) {
      console.error('[vision] OpenAI API Error:', ai);
      throw new Error(ai?.error?.message || 'No response from OpenAI');
    }

    // Extract text from GPT-5 mini response format
    let answer = 'Sorry, I could not analyze the image.';
    
    if (ai.output && Array.isArray(ai.output)) {
      // Look for the message type output that contains the text
      const messageOutput = ai.output.find(item => item.type === 'message' && item.content);
      if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
        console.log('[vision] Message content array:', messageOutput.content);
        // Find the text content - GPT-5 mini uses 'output_text' type
        const textContent = messageOutput.content.find(item => item.type === 'output_text');
        console.log('[vision] Found text content:', textContent);
        
        if (textContent && textContent.text) {
          answer = textContent.text.trim();
          console.log('[vision] Extracted answer:', answer);
        }
      }
    }
    
    // Fallback to output_text if available
    if (answer === 'Sorry, I could not analyze the image.' && ai.output_text) {
      answer = ai.output_text.trim();
    }

    console.log('[vision] GPT-5 mini analysis successful');
    return res.json({ answer, imageUrl });

  } catch (err) {
    console.error('[vision] error:', err);
    res.status(500).json({ error: err.stack || err.message || 'vision error' });
  }
});

module.exports = router;
