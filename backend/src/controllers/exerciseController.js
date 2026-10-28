const exerciseService = require('../services/exerciseService');

const getExercises = async (req, res) => {
  try {
    const exercises = await exerciseService.getExercises();
    res.json({ success: true, exercises });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getExercises };
