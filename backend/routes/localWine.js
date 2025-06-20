// backend/routes/localWine.js
const express     = require('express');
const router      = express.Router();
const Preference  = require('../models/Preference');

/**
 * GET /api/zip/:email
 * Returns the stored ZIP (postal) code for the given user email.
 *
 * Response:
 *   200 { zip: "90210" }
 *   404 { message: "User not found" }
 */
router.get('/zip/:email', async (req, res) => {
  try {
    const pref = await Preference.findOne({ email: req.params.email });
    if (!pref) return res.status(404).json({ message: 'User not found' });

    res.json({ zip: pref.zip || '' });
  } catch (err) {
    console.error('ZIP lookup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
