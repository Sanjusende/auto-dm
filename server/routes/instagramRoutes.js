const express = require('express');
const router = express.Router();
const { getAuthUrl, authCallback, saveCredentials, getMedia } = require('../controllers/instagramController');
const { protect } = require('../middleware/authMiddleware');

router.get('/auth', getAuthUrl);
router.get('/callback', authCallback);
router.post('/save', protect, saveCredentials);
router.get('/media', protect, getMedia);

module.exports = router;
