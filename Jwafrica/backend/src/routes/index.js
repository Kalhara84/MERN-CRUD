const router = require('express').Router();
const { loginRequired, adminRequired } = require('../middleware/auth');
const { asyncHandler: ah } = require('../utils/httpError');

const auth = require('../controllers/authController');
const dashboard = require('../controllers/dashboardController');
const users = require('../controllers/userController');
const expire = require('../controllers/expireController');

// Login
router.post('/auth/login', ah(auth.login));
router.get('/auth/me', loginRequired, ah(auth.me));

// Dashboard
router.get('/dashboard', loginRequired, ah(dashboard.stats));

// Users (admin only)
router.get('/users', adminRequired, ah(users.list));
router.post('/users', adminRequired, ah(users.create));
router.get('/users/:id', adminRequired, ah(users.get));
router.put('/users/:id', adminRequired, ah(users.update));
router.delete('/users/:id', adminRequired, ah(users.remove));

// Expire Module (all logged-in users). The fixed paths must stay above "/:id".
router.get('/expire', loginRequired, ah(expire.list));
router.get('/expire/lookups', loginRequired, ah(expire.lookups));
router.post('/expire/locations', loginRequired, ah(expire.addLocation));
router.post('/expire', loginRequired, ah(expire.create));
router.get('/expire/:id', loginRequired, ah(expire.get));
router.put('/expire/:id', loginRequired, ah(expire.update));
router.delete('/expire/:id', loginRequired, ah(expire.remove));

module.exports = router;
