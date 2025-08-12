const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });

// Cancel subscription route
router.post('/cancel', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: 'User or Stripe customer not found' });
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (!subscriptions.data.length) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const subscriptionId = subscriptions.data[0].id;

    // Cancel at period end
    const canceledSub = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // DON'T mark subscription inactive here; wait for webhook to update at period end
    // user.stripeSubscriptionActive = false;
    // await user.save();

    res.json({
      message: 'Subscription cancellation scheduled at period end',
      cancelAt: canceledSub.cancel_at_period_end,
    });
  } catch (err) {
    console.error('Subscription cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get subscription end date route (unchanged)
router.get('/end-date', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: 'User or Stripe customer not found' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (!subscriptions.data.length) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const currentSub = subscriptions.data[0];
    res.json({ endDate: currentSub.current_period_end * 1000 }); // milliseconds timestamp
  } catch (err) {
    console.error('Fetch subscription end date error:', err);
    res.status(500).json({ error: 'Failed to fetch subscription end date' });
  }
});

module.exports = router;

