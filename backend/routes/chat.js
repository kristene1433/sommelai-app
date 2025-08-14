const express = require('express');
const router = express.Router();

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Chat route is working!',
    timestamp: new Date().toISOString()
  });
});

// Simple chat endpoint
router.post('/somm', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Chat endpoint is working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
