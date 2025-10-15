const express = require('express');
const router = express.Router();

// Dummy search route
router.get('/', (req, res) => {
  res.send('✅ Search route is working');
});

module.exports = router;
