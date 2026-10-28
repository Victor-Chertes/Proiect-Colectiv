const sessionService = require('../services/sessionService');

const startSession = async (req, res) => {
  try {
    const { workoutId } = req.body;
    if (!workoutId) {
      return res.status(400).json({ success: false, message: 'workoutId este obligatoriu.' });
    }
    const session = await sessionService.startWorkoutSession({
      workoutId: parseInt(workoutId),
      userId: req.user.id,
    });

    res.status(201).json({ success: true, session });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

const completeSet = async (req, res) => {
  res.status(200).json({ success: true, message: 'Set tracked on frontend; use /finish for batch save.' });
};

const finishSession = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { sets } = req.body;

    const session = await sessionService.finishWorkoutSession({
      sessionId,
      userId: req.user.id,
      sets,
    });

    res.json({ success: true, session });

  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: err.message });
    if (err.code === 'INVALID_STATUS') return res.status(409).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

const abandonSession = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const session = await sessionService.abandonWorkoutSession({
      sessionId,
      userId: req.user.id,
    });
    res.json({ success: true, session });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { startSession, completeSet, finishSession, abandonSession };
