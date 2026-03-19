// routes/sellerRoutes.js – corrected version

const express = require('express');
const router = express.Router();

// ── Fix 1: Use named import { protect } instead of auth
const { protect } = require('../middleware/auth');

// Multer middleware (this one is correct – returns a function)
const upload = require('../middleware/multer');

// Controller function (assuming it's correctly exported)
const { updateProfile } = require('../controllers/sellerController');

router.patch('/profile', protect, upload.single('logo'), updateProfile);

router.get('/me', protect, (req, res) => {
  res.json({
    success: true,
    seller: req.seller
  });
});

module.exports = router;