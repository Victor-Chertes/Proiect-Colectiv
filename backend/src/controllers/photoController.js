const photoService = require('../services/photoService');

const getFolders = async (req, res) => {
  try {
    const folders = await photoService.getFolders(req.user.id);
    res.json({ success: true, folders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createFolder = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Numele folderului este obligatoriu.' });
    }
    const folder = await photoService.createFolder(req.user.id, name);
    res.status(201).json({ success: true, folder });
  } catch (err) {
    if (err.code === 'DUPLICATE_NAME') {
      return res.status(409).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const getFolderPhotos = async (req, res) => {
  try {
    const folderId = parseInt(req.params.id);
    const folder = await photoService.getFolderPhotos(folderId, req.user.id);
    res.json({ success: true, folder });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

const uploadPhoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Niciun fișier primit. Te rugăm să selectezi o imagine validă.',
    });
  }

  try {
    const folderId = parseInt(req.params.id);

    const photo = await photoService.processPhoto(folderId, req.user.id, req.file);

    res.status(201).json({ success: true, photo });

  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: err.message });

    if (err.code === 'ENOSPC') {
      return res.status(507).json({
        success: false,
        message: 'Spațiu de stocare insuficient. Nu mai pot fi încărcate poze momentan.',
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const deletePhoto = async (req, res) => {
  try {
    const photoId = parseInt(req.params.id);
    await photoService.deletePhoto(photoId, req.user.id);
    res.json({ success: true, message: 'Poza a fost ștearsă.' });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getFolders, createFolder, getFolderPhotos, uploadPhoto, deletePhoto };
