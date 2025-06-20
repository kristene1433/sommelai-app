const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  stripeCustomerId: String,
  stripeSubscriptionActive: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema);
