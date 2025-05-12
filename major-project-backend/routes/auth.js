const express = require('express');
const router = express.Router();
const { signup, login, logout, validateSession } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/validate-session', validateSession);

module.exports = router;
