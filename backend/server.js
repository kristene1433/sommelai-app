const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');

dotenv.config();
const app = express();

app.use(cors());
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

// 4. Preferences/profile/account routes (includes change-email/password)
const preferenceRoutes = require('./routes/preferences');
app.use('/api/preferences', preferenceRoutes);

// 5. Vision routes
const vision = require('./routes/vision');
app.use('/api/vision', vision);        // e.g. POST /api/vision/somm

// MongoDB connect
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// For Stripe webhook (must be raw)
app.use('/api/webhook/stripe', require('./routes/stripe-webhook'));
app.use(bodyParser.json()); // for other routes

app.use(require('./routes/create-checkout-session'));
app.use(require('./routes/auth'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

