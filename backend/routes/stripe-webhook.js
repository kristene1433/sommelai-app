const express = require('express');
const User = require('../models/User');
const Preference = require('../models/Preference');
const Stripe = require('stripe');
const tempPasswords = require('../tempPasswordStore');
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Set in Heroku Config Vars

// Stripe Webhook (mount at /api/webhook/stripe from server.js)
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('Webhook received:', event.type);
  } catch (err) {
    console.error('Webhook signature failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_email;
      const stripeCustomerId = session.customer;
      console.log('Session completed for email:', email);

      // Only create user if doesn't exist yet
      let user = await User.findOne({ email });
      if (!user) {
        const passwordHash = tempPasswords.get(email);
        if (!passwordHash) {
          console.error('No password found in temp storage for:', email);
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
      } else {
        // If user exists, update subscription active flag & stripeCustomerId if missing
        user.stripeSubscriptionActive = true;
        if (!user.stripeCustomerId) user.stripeCustomerId = stripeCustomerId;
        await user.save();
        console.log('User already exists, subscription activated:', email);
      }

      // Always ensure a Preference exists and is set to "paid"
      let pref = await Preference.findOne({ email });
      if (!pref) {
        pref = new Preference({
          email,
          plan: 'paid'
        });
        await pref.save();
        console.log('Preference created for paid user:', email);
      } else if (pref.plan !== 'paid') {
        pref.plan = 'paid';
        await pref.save();
        console.log('Preference plan upgraded to paid for:', email);
      }
    }

    else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      // Find user by stripeCustomerId and mark subscription inactive
      const user = await User.findOne({ stripeCustomerId: customerId });
      if (user) {
        user.stripeSubscriptionActive = false;
        await user.save();
        console.log(`Subscription ended for user ${user.email}, marked inactive.`);
      } else {
        console.warn('User not found for customer:', customerId);
      }
    }

    // You can add more event handlers here if needed

  } catch (err) {
    console.error('Error processing webhook event:', err);
    return res.status(500).send('Webhook handler error');
  }

  res.json({ received: true });
});

module.exports = router;


