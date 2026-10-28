const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getExercises } = require('../controllers/exerciseController');

router.get('/', auth, getExercises);

module.exports = router;
