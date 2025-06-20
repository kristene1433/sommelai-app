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
  if (!user.stripeSubscriptionActive) {
    return res.status(400).json({ error: 'No active subscription. Please sign up and pay.' });
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  res.json({ success: true, user: { email: user.email } });
});

module.exports = router;


