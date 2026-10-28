const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getProgressSheets,
  createProgressSheet,
  getProgressSheet,
  addProgressEntry,
  deleteProgressSheet,
  updateProgressEntry,
  deleteProgressEntry,
} = require('../controllers/progressController');

router.get('/', auth, getProgressSheets);                          
router.post('/', auth, createProgressSheet);                      
router.get('/:id', auth, getProgressSheet);                        
router.post('/:id/entries', auth, addProgressEntry);               
router.delete('/:id', auth, deleteProgressSheet);                  
router.put('/entries/:entryId', auth, updateProgressEntry);        
router.delete('/entries/:entryId', auth, deleteProgressEntry);     

module.exports = router;
