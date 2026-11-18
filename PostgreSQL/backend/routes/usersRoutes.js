const router = require('express').Router();
const users = require('../controllers/usersController');
const {
  loginRequired,
  adminOnly
} = require('../auth');
router.use(loginRequired, adminOnly);
router.get('/', users.list);
router.get('/:id', users.find);
router.post('/', users.create);
router.put('/:id', users.update);
router.delete('/:id', users.remove);
module.exports = router;
