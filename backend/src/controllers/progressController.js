const progressService = require('../services/progressService');

const getProgressSheets = async (req, res) => {
  try {
    const sheets = await progressService.getProgressSheets(req.user.id);
    res.json({ success: true, sheets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createProgressSheet = async (req, res) => {
  try {
    const { name, description } = req.body;
    const sheet = await progressService.createProgressSheet(req.user.id, name, description);

    res.status(201).json({ success: true, sheet });

  } catch (err) {
    if (err.code === 'EMPTY_NAME') return res.status(400).json({ success: false, message: err.message });
    if (err.code === 'DUPLICATE_NAME') return res.status(409).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

const getProgressSheet = async (req, res) => {
  try {
    const sheetId = parseInt(req.params.id);
    const sheet = await progressService.getProgressSheet(sheetId, req.user.id);
    res.json({ success: true, sheet });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

const addProgressEntry = async (req, res) => {
  try {
    const sheetId = parseInt(req.params.id);
    const { value, notes } = req.body;
    const entry = await progressService.addProgressEntry(sheetId, req.user.id, value, notes);

    res.status(201).json({ success: true, entry });

  } catch (err) {
    if (err.code === 'SHEET_NOT_FOUND') {
      return res.status(404).json({ success: false, code: err.code, message: err.message });
    }
    if (err.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: err.message });
    if (err.code === 'EMPTY_VALUE') return res.status(400).json({ success: false, message: err.message });
    if (err.code === 'INVALID_VALUE') {
      return res.status(400).json({ success: false, code: err.code, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteProgressSheet = async (req, res) => {
  try {
    const sheetId = parseInt(req.params.id);
    await progressService.deleteProgressSheet(sheetId, req.user.id);

    res.json({ success: true, message: 'Fișa a fost ștearsă.' });
  } catch (err) {

    if (err.code === 'SHEET_NOT_FOUND') {
      return res.status(404).json({ success: false, code: err.code, message: err.message });
    }
    if (err.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: err.message });

    res.status(500).json({
      success: false,
      message: 'Nu am putut șterge fișa. Te rugăm să încerci din nou.',
    });
  }
};

const updateProgressEntry = async (req, res) => {
  try {
    const entryId = parseInt(req.params.entryId);
    const { value, notes } = req.body;
    const updated = await progressService.updateProgressEntry(entryId, req.user.id, value, notes);
    res.json({ success: true, entry: updated });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: err.message });
    if (err.code === 'EMPTY_VALUE') return res.status(400).json({ success: false, message: err.message });
    if (err.code === 'INVALID_VALUE') {
      return res.status(400).json({ success: false, code: err.code, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteProgressEntry = async (req, res) => {
  try {
    const entryId = parseInt(req.params.entryId);
    await progressService.deleteProgressEntry(entryId, req.user.id);
    res.json({ success: true, message: 'Intrarea a fost ștearsă.' });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getProgressSheets,
  createProgressSheet,
  getProgressSheet,
  addProgressEntry,
  deleteProgressSheet,
  updateProgressEntry,
  deleteProgressEntry,
};
