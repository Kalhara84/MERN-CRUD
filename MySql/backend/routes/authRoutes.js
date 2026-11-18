const router = require('express').Router();
const auth = require('../controllers/authController');

const {
  loginRequired
} = require('../auth');

router.post('/login', auth.login);
router.get('/me', loginRequired, auth.me);
module.exports = router;
