const express = require('express');
const router = express.Router();
const Preference = require('../models/Preference');
const bcrypt = require('bcryptjs');

// Save or update preferences/profile info
router.post('/', async (req, res) => {
  const {
    email,
    firstName, lastName, address, city, state, zip, areaCode, phone,
    wineTypes = [], flavorProfiles = [], plan,
  } = req.body;

  if (!email) return res.status(400).json({ message: 'Email required' });

  try {
    await Preference.findOneAndUpdate(
      { email },
      {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(zip !== undefined && { zip }),
        ...(areaCode !== undefined && { areaCode }),
        ...(phone !== undefined && { phone }),
        wineTypes,
        flavorProfiles,
        ...(plan ? { plan } : {}),
      },
      { upsert: true, new: true }
    );
    res.json({ message: 'Preferences saved.' });
  } catch (err) {
    console.error('Save prefs error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Fetch preferences by email
router.get('/:email', async (req, res) => {
  try {
    const pref = await Preference.findOne({ email: req.params.email });
    if (!pref) return res.status(404).json({ message: 'Not found' });
    // Return info about password presence for front end!
    res.json({
      ...pref.toObject(),
      hasPassword: !!pref.passwordHash
    });
  } catch (err) {
    console.error('Fetch prefs error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Change Email
router.post('/change-email', async (req, res) => {
  try {
    const { userId, newEmail } = req.body;
    if (!userId || !newEmail) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const emailExists = await Preference.findOne({ email: newEmail });
    if (emailExists) {
      return res.status(409).json({ error: 'Email is already in use.' });
    }
    const user = await Preference.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    // Save new email
    user.email = newEmail;
    await user.save();
    return res.json({ message: 'Email changed successfully.' });
  } catch (err) {
    console.error('Change email error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Set Password (for accounts that never set password before)
router.post('/set-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const user = await Preference.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (user.passwordHash) {
      return res.status(400).json({ error: 'Password already set.' });
    }
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();
    return res.json({ message: 'Password set successfully.' });
  } catch (err) {
    console.error('Set password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Change Password (requires existing password)
router.post('/change-password', async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const user = await Preference.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (!user.passwordHash) {
      return res.status(400).json({ error: 'No password set for this account. Please set a password first.' });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Old password is incorrect.' });
    }
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    user.passwordHash = newHash;
    await user.save();
    return res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
