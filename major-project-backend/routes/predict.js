const express = require('express');
const router = express.Router();
const { 
    predict
} = require('../controllers/predictController');
const upload = require('../middleware/upload');

router.post('/', upload.single('file'), predict);

// Add a test endpoint to verify the predict route is registered
router.get('/', (req, res) => {
  res.json({ message: 'Prediction API is working' });
});

module.exports = router;
