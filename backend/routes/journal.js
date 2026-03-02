const express = require('express');
const WineJournalEntry = require('../models/WineJournalEntry.js');

const router = express.Router();

/* ----------  ADD  (POST)  ---------- */
router.post('/add', async (req, res) => {
  console.log('POST /add body:', req.body);
  try {
    const { userEmail, ...rest } = req.body || {};
    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail is required.' });
    }

    const newEntry = new WineJournalEntry({ ...rest, userEmail });
    const saved = await newEntry.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving wine journal entry:', err);
    res.status(400).json({ error: err.message || 'Invalid input.' });
  }
});


/* ----------  DELETE  (by _id, with owner check)  ---------- */
/*  Client hits: DELETE /api/journal/<id>?userEmail=<email>   */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail query param is required.' });
    }

    const entry = await WineJournalEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found.' });
    }
    if (entry.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Not allowed to delete this entry.' });
    }

    await entry.deleteOne();
    res.sendStatus(204); // No-Content on success
  } catch (err) {
    console.error('Error deleting entry:', err);
    res.status(500).json({ error: 'Failed to delete entry.' });
  }
});

/* ----------  LIST  (by userEmail)  ---------- */
/*  Client hits: GET /api/journal/<email>     */
router.get('/:email', async (req, res) => {
  try {
    const entries = await WineJournalEntry
      .find({ userEmail: req.params.email })
      .sort({ dateLogged: -1 });
    res.json(entries);
  } catch (err) {
    console.error('Error fetching wine journal entries:', err);
    res.status(500).json({ error: 'Failed to fetch journal entries.' });
  }
});

// PUT /api/journal/:id  – edit existing entry (with owner check)
router.put('/:id', async (req, res) => {
  try {
    const { userEmail, ...rest } = req.body || {};
    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail is required.' });
    }

    const existing = await WineJournalEntry.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Entry not found.' });
    }
    if (existing.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Not allowed to edit this entry.' });
    }

    const updated = await WineJournalEntry.findByIdAndUpdate(
      req.params.id,
      { ...rest, userEmail },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (err) {
    console.error('Error updating entry:', err);
    res.status(500).json({ error: 'Failed to update entry.' });
  }
});

module.exports = router;

