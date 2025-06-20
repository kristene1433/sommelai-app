const express = require('express');
const User = require('../models/User');
const Stripe = require('stripe');
const tempPasswords = require('../tempPasswordStore');


const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Set in your env

router.post('/api/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email;
    const stripeCustomerId = session.customer;

    // Only create user if doesn't exist yet
    let user = await User.findOne({ email });
    if (!user) {
      const passwordHash = tempPasswords.get(email);
      if (!passwordHash) {
        console.error('No password found in temp storage');
        return res.status(500).send('No password for email');
      }

      user = new User({
        email,
        passwordHash,
        stripeCustomerId,
        stripeSubscriptionActive: true,
      });
      await user.save();
      tempPasswords.delete(email); // Clean up
      console.log('User created after Stripe payment:', email);
    }
  }
  res.json({ received: true });
});

module.exports = router;
