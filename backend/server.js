const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();

app.use(cors());

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
const vision = require('./routes/vision');
app.use('/api/vision', vision); // e.g. POST /api/vision/somm

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


