const router = require('express').Router();
const controller = require('../controllers/usersController');
router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', controller.postAll);
router.put('/:id', controller.putOne);
router.delete('/:id', controller.deleteOne);
module.exports = router;
