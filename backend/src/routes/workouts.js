const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const {
  getMyWorkouts,
  getPublicWorkouts,
  getWorkoutById,
  createWorkout,
  createPublicWorkout,
  copyWorkout,
  updateWorkout,
  deleteWorkout,
} = require('../controllers/workoutController');

router.get('/', auth, getMyWorkouts);                             
router.get('/public', auth, getPublicWorkouts);                    
router.get('/:id', auth, getWorkoutById);                          
router.post('/', auth, createWorkout);                             
router.post('/public', auth, requireAdmin, createPublicWorkout);   
router.post('/:id/copy', auth, copyWorkout);                       
router.put('/:id', auth, updateWorkout);                           
router.delete('/:id', auth, deleteWorkout);                        

module.exports = router;
