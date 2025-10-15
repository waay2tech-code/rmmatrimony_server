const express = require('express');
const {
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats
} = require('../controllers/contactController');
const { validateContact } = require('../middlewares/validation');

const router = express.Router();

// Public routes
router.post('/', validateContact, createContact);

// Private routes (add authentication middleware as needed)
router.get('/stats', getContactStats);
router.get('/', getAllContacts);
router.get('/:id', getContactById);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

module.exports = router;
