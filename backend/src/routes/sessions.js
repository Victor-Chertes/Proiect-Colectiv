const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { startSession, completeSet, finishSession, abandonSession } = require('../controllers/sessionController');

router.post('/', auth, startSession);                  
router.put('/:id/set', auth, completeSet);             
router.put('/:id/finish', auth, finishSession);        
router.put('/:id/abandon', auth, abandonSession);      

module.exports = router;
