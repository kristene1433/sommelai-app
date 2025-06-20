const express = require('express');
const Stripe = require('stripe');
const bcrypt = require('bcryptjs');
const tempPasswords = require('../tempPasswordStore');
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

const YOUR_SCHEME = 'sommelai-app://';
const SUCCESS_URL = `${YOUR_SCHEME}checkout-success`;
const CANCEL_URL  = `${YOUR_SCHEME}checkout-cancel`;

router.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    // Hash password and store in temp memory
    const passwordHash = await bcrypt.hash(password, 10);
    tempPasswords.set(email, passwordHash);
    console.log('Password stored in temp for:', email);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price: 'price_1R2H24G3CmMC7BS0Z0cst8Jy', // Your Stripe Price ID
        quantity: 1,
      }],
      subscription_data: { trial_period_days: 30 },
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('STRIPE CHECKOUT ERROR:', err);
    res.status(500).json({ error: 'Stripe session creation failed' });
  }
});

module.exports = router;


