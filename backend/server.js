const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();

// Configure CORS to allow requests from Vercel frontend
app.use(cors({
  origin: [
    'https://sommelai-app.vercel.app',
    'https://sommelai-gts90r451-kristene1433s-projects.vercel.app',
    'https://sommelai-aoqfa962y-kristene1433s-projects.vercel.app',
    'https://sommelai-moh4ni3l9-kristene1433s-projects.vercel.app',
    'https://sommelai-lawx1c9u2-kristene1433s-projects.vercel.app',
    'https://sommelai-mk1bvc0jf-kristene1433s-projects.vercel.app',
    'https://sommelai-1a3xt9mjo-kristene1433s-projects.vercel.app',
    'http://localhost:3000', // For local development
    'http://localhost:19006' // For Expo development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ⚠️ Stripe webhook must come BEFORE express.json/bodyParser.json!
app.use('/api/webhook/stripe', require('./routes/stripe-webhook'));

// Now you can parse JSON for all other routes
app.use(express.json());

// 1. Journal routes
const journalRoutes = require('./routes/journal.js');
app.use('/api/journal', journalRoutes);

// 2. Search wine local routes
const searchWineLocal = require('./routes/searchWineLocal');
app.use('/api', searchWineLocal);

// 3. Local wine routes
const localWine = require('./routes/localWine');
app.use('/api', localWine);

// 4. Preferences/profile/account routes
const preferenceRoutes = require('./routes/preferences');
app.use('/api/preferences', preferenceRoutes);

// 5. Vision routes
const visionRouter = require('./routes/vision');
app.use('/api/vision', visionRouter); 

// 6. Chat routes
const chatRouter = require('./routes/chat');
app.use('/api/chat', chatRouter);

// 7. Web search routes
const webSearchRouter = require('./routes/webSearch');
app.use('/api/webSearch', webSearchRouter);

// 7. Cancel subscription routes
const cancelRoutes = require('./routes/cancel');  // or correct path
app.use('/api/subscription', cancelRoutes);

// MongoDB connect
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// Auth and Stripe checkout
app.use(require('./routes/create-checkout-session'));
app.use(require('./routes/auth'));

app.get('/', (req, res) => {
  res.send('API is running! 🍷');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));