const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getFolders, createFolder, getFolderPhotos, uploadPhoto, deletePhoto } = require('../controllers/photoController');

const handleUpload = (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'Fișierul depășește limita de 5MB. Te rugăm să încarci o imagine mai mică.',
      });
    }

    if (err.message && err.message.includes('imagine validă')) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (err.code === 'ENOSPC') {
      return res.status(507).json({
        success: false,
        message: 'Spațiu de stocare insuficient. Nu mai pot fi încărcate poze momentan.',
      });
    }
    next(err);
  });
};

router.get('/folders', auth, getFolders);                                   
router.post('/folders', auth, createFolder);                                
router.get('/folders/:id', auth, getFolderPhotos);                          
router.post('/folders/:id/upload', auth, handleUpload, uploadPhoto);        
router.delete('/:id', auth, deletePhoto);                                  

module.exports = router;
