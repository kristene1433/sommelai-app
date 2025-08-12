// models/Preference.js
const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, unique: true },

    // Hashed password for login/change password support
    passwordHash: { type: String, default: '' },

    firstName:    { type: String, default: '' },
    lastName:     { type: String, default: '' },
    address:      { type: String, default: '' },
    city:         { type: String, default: '' },
    state:        { type: String, default: '' },
    zip:          { type: String, default: '' },
    areaCode:     { type: String, default: '' },
    phone:        { type: String, default: '' },

    wineTypes:      [String],
    flavorProfiles: [String],

    body: { type: String, enum: ['Big', 'Medium', 'Light'], default: '' },  // Added body field

    plan: { type: String, enum: ['paid'], default: 'paid' },  // << Only paid
  },
  { timestamps: true }
);

module.exports = mongoose.model('Preference', preferenceSchema);
