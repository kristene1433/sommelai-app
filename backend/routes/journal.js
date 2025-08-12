const express = require('express');
const WineJournalEntry = require('../models/WineJournalEntry.js');

const router = express.Router();

/* ----------  ADD  (POST)  ---------- */
router.post('/add', async (req, res) => {
  console.log('POST /add body:', req.body);  // Add this line for debugging
  try {
    const newEntry = new WineJournalEntry(req.body);
    const saved = await newEntry.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving wine journal entry:', err);
    res.status(400).json({ error: err.message || 'Invalid input.' });
  }
});


/* ----------  DELETE  (by _id)  ---------- */
/*  Client hits: DELETE /api/journal/<id>   */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await WineJournalEntry.findByIdAndDelete(id);
    res.sendStatus(204);                       // No-Content on success
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

// PUT /api/journal/:id  – edit existing entry
router.put('/:id', async (req, res) => {
  try {
    const updated = await WineJournalEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Entry not found.' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating entry:', err);
    res.status(500).json({ error: 'Failed to update entry.' });
  }
});

module.exports = router;

