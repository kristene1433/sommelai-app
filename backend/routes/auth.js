const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ error: 'User not found. Please sign up and pay.' });
  }
  // DEV ONLY: bypass subscription check so we can use the app without Stripe
  // if (!user.stripeSubscriptionActive) {
  //   return res.status(400).json({ error: 'No active subscription. Please sign up and pay.' });
  // }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  res.json({ success: true, user: { email: user.email } });
});

// DEV ONLY: create or update a user without Stripe
router.post('/api/dev/create-user', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    let user = await User.findOne({ email });
    const passwordHash = await bcrypt.hash(password, 10);

    if (!user) {
      user = new User({
        email,
        passwordHash,
        stripeSubscriptionActive: true,
      });
    } else {
      user.passwordHash = passwordHash;
      user.stripeSubscriptionActive = true;
    }

    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('dev create-user error:', err);
    res.status(500).json({ error: 'Failed to create dev user.' });
  }
});

module.exports = router;


