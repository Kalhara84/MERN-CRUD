const router = require('express').Router();
const customers = require('../controllers/customersController');
const { loginRequired } = require('../auth');

router.use(loginRequired);
router.get('/lookups', customers.lookups);
router.get('/next-code', customers.nextCode);
router.get('/', customers.list);
router.get('/:id', customers.find);
router.post('/', customers.create);
router.put('/:id', customers.update);
router.delete('/:id', customers.remove);

module.exports = router;
