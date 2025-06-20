/* routes/vision.js
   POST /api/vision/somm
   Accepts: multipart form { photo, question }
   Uploads to S3 (bucket-owner-enforced), presigns, sends both to GPT-4o Vision.
   Returns: { answer, imageUrl }
   ───────────────────────────────────────── */

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
       if (!req.file) return res.status(400).json({ error: 'No “photo” file' });
       if (!validMime.test(req.file.mimetype))
         return res.status(400).json({ error: 'JPEG or PNG only' });
       if (req.file.size > maxBytes)
         return res.status(400).json({ error: 'Max size 4 MB' });
   
       // 2) Upload to S3
       const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
       const key = `wine/${Date.now()}-${slugify(req.file.originalname)}.${ext}`;
   
       await s3.send(new PutObjectCommand({
         Bucket     : process.env.BUCKET,
         Key        : key,
         Body       : req.file.buffer,
         ContentType: req.file.mimetype,
         // No ACL (bucket-owner-enforced)
       }));
   
       // 3) Presigned URL
       const imageUrl = await getSignedUrl(
         s3,
         new GetObjectCommand({ Bucket: process.env.BUCKET, Key: key }),
         { expiresIn: 900 } // 15 min
       );
   
       // 4) Get question from form-data (default prompt if missing)
       const userQuestion =
         (req.body && req.body.question && req.body.question.trim())
           ? req.body.question.trim()
           : 'Suggest wine style and food pairing:';
   
       // 5) Call GPT-4o Vision
       const ai = await fetch('https://api.openai.com/v1/chat/completions', {
         method : 'POST',
         headers: {
           Authorization : `Bearer ${process.env.OPENAI_API_KEY}`,
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           model: 'gpt-4o',
           messages: [{
             role: 'user',
             content: [
               { type: 'text', text: userQuestion },
               { type: 'image_url', image_url: { url: imageUrl } },
             ],
           }],
         }),
       }).then(r => r.json());
   
       const answer =
         ai.choices?.[0]?.message?.content?.trim() ||
         'Sorry, I could not analyse the image.';
   
       res.json({ answer, imageUrl });
     } catch (err) {
       console.error('[vision] error:', err);
       res.status(500).json({ error: 'vision error' });
     }
   });
   
   module.exports = router;
   