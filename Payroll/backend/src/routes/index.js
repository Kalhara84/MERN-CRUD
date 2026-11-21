const express = require('express');
const { requireAuth, wrap } = require('../middleware');
const { AuthController } = require('../controllers/auth.controller');
const { DashboardController } = require('../controllers/dashboard.controller');
const { EmployeeController, LookupController } = require('../controllers/employee.controller');

const router = express.Router();

// public
router.post('/auth/login', wrap(AuthController.login));

// everything below needs a valid token
router.use(requireAuth);
router.get('/auth/me', AuthController.me);
router.get('/dashboard', wrap(DashboardController.summary));
router.get('/lookups', wrap(LookupController.all));

router.get('/employees', wrap(EmployeeController.list));
router.post('/employees', wrap(EmployeeController.create));
router.get('/employees/:id', wrap(EmployeeController.get));
router.put('/employees/:id', wrap(EmployeeController.update));
router.delete('/employees/:id', wrap(EmployeeController.remove));

module.exports = router;
