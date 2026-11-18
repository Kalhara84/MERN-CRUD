const router = require('express').Router();
const { login } = require('../controllers/authController');
const { loginRequired } = require('../middleware/auth');
router.post('/login', login);
router.get('/me', loginRequired, (req, res) => res.json({ user: req.user }));
module.exports = router;
