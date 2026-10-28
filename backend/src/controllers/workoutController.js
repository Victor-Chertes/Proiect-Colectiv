const workoutService = require('../services/workoutService');

const getWorkoutById = async (req, res) => {
  try {
    const workoutId = parseInt(req.params.id);
    const workout = await workoutService.getWorkoutById(workoutId, req.user.id);
    if (!workout) {
      return res.status(404).json({ success: false, message: 'Antrenamentul nu a fost găsit.' });
    }
    res.json({ success: true, workout });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyWorkouts = async (req, res) => {
  try {
    const workouts = await workoutService.getMyWorkouts(req.user.id);
    res.json({ success: true, workouts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createWorkout = async (req, res) => {
  try {
    const { name, description, restTime, exercises } = req.body;

    const workout = await workoutService.createWorkout({
      name,
      description,
      restTime,
      userId: req.user.id,
      exercises,
    });

    res.status(201).json({ success: true, workout });

  } catch (err) {

    if (err.code === 'DUPLICATE_NAME') {
      return res.status(409).json({ success: false, message: err.message });
    }
    const status = err.message.includes('obligatoriu') || err.message.includes('exerci') ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

const getPublicWorkouts = async (req, res) => {
  try {
    const workouts = await workoutService.getPublicWorkouts();
    res.json({ success: true, workouts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createPublicWorkout = async (req, res) => {
  try {
    const { name, description, restTime, exercises } = req.body;

    const workout = await workoutService.createPublicWorkout({
      name,
      description,
      restTime,
      adminId: req.user.id,
      exercises,
    });

    res.status(201).json({ success: true, workout });

  } catch (err) {

    if (err.code === 'DUPLICATE_NAME') {
      return res.status(409).json({ success: false, message: err.message });
    }
    const status =
      err.message.includes('obligatoriu') || err.message.includes('exerci') ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

const copyWorkout = async (req, res) => {
  try {
    const workoutId = parseInt(req.params.id);
    const workout = await workoutService.copyPublicWorkout({
      workoutId,
      userId: req.user.id,
    });
    res.status(201).json({ success: true, workout });
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.code === 'FORBIDDEN') {
      return res.status(403).json({ success: false, message: err.message });
    }
    if (err.code === 'DUPLICATE_NAME') {
      return res.status(409).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateWorkout = async (req, res) => {
  try {
    const workoutId = parseInt(req.params.id);
    const { name, description, restTime, exercises } = req.body;

    const workout = await workoutService.updateWorkout({
      workoutId,
      userId: req.user.id,
      name,
      description,
      restTime,
      exercises,
    });

    res.json({ success: true, workout });

  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.code === 'FORBIDDEN') {
      return res.status(403).json({ success: false, message: err.message });
    }
    if (err.code === 'DUPLICATE_NAME') {
      return res.status(409).json({ success: false, message: err.message });
    }
    const status = err.message.includes('obligatoriu') || err.message.includes('exerci') ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

const deleteWorkout = async (req, res) => {
  try {
    const workoutId = parseInt(req.params.id);

    await workoutService.deleteWorkout(workoutId, req.user.id, req.user.role);

    res.json({ success: true, message: 'Antrenament șters cu succes.' });

  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.code === 'FORBIDDEN') {
      return res.status(403).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMyWorkouts,
  getPublicWorkouts,
  getWorkoutById,
  createWorkout,
  createPublicWorkout,
  copyWorkout,
  updateWorkout,
  deleteWorkout,
};
