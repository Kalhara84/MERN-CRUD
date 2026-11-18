const router = require('express').Router();
const dashboard = require('../controllers/dashboardController');
const {
  loginRequired
} = require('../auth');
router.get('/', loginRequired, dashboard.summary);
module.exports = router;
