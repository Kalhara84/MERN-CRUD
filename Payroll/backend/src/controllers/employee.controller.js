const { EmployeeModel } = require('../models/employee.model');
const { LookupModel } = require('../models/lookup.model');
const { validateEmployee } = require('../validators/employee.validator');

const fail = (res, message, status) => res.status(status).json({ message });

function parseId(raw) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const isObject = (b) => b && typeof b === 'object' && !Array.isArray(b);

/** same rules as the old PHP screen: unique employee no + unique map code */
async function duplicateError(data, ignoreId) {
  if (typeof data.empeno === 'number') {
    const f = await EmployeeModel.findByEmpNo(data.empeno);
    if (f && f.empsno !== ignoreId) return `Employee No ${data.empeno} already exists`;
  }
  if (typeof data.empmapcode === 'number' && data.empmapcode !== 0) {
    const f = await EmployeeModel.findByMapCode(data.empmapcode);
    if (f && f.empsno !== ignoreId) return `Map Code ${data.empmapcode} already exists`;
  }
  return null;
}

const EmployeeController = {
  /** GET /api/employees?search=&page=1&limit=10 */
  async list(req, res) {
    const search = String(req.query.search || '').trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    res.json(await EmployeeModel.list(search, page, limit));
  },

  /** GET /api/employees/:id */
  async get(req, res) {
    const n = parseId(req.params.id);
    if (!n) return fail(res, 'Invalid id', 400);
    const emp = await EmployeeModel.findById(n);
    return emp ? res.json(emp) : fail(res, `Employee #${n} not found`, 404);
  },

  /** POST /api/employees */
  async create(req, res) {
    if (!isObject(req.body)) return fail(res, 'Invalid JSON body', 400);
    const { errors, data } = validateEmployee(req.body, false);
    if (errors.length) return fail(res, errors, 400);

    const dup = await duplicateError(data);
    if (dup) return fail(res, dup, 409);

    const id = await EmployeeModel.create(data);
    res.status(201).json(await EmployeeModel.findById(id));
  },

  /** PUT /api/employees/:id */
  async update(req, res) {
    const n = parseId(req.params.id);
    if (!n) return fail(res, 'Invalid id', 400);
    if (!(await EmployeeModel.findById(n))) return fail(res, `Employee #${n} not found`, 404);
    if (!isObject(req.body)) return fail(res, 'Invalid JSON body', 400);

    const { errors, data } = validateEmployee(req.body, true);
    if (errors.length) return fail(res, errors, 400);

    const dup = await duplicateError(data, n);
    if (dup) return fail(res, dup, 409);

    await EmployeeModel.update(n, data);
    res.json(await EmployeeModel.findById(n));
  },

  /** DELETE /api/employees/:id */
  async remove(req, res) {
    const n = parseId(req.params.id);
    if (!n) return fail(res, 'Invalid id', 400);
    const emp = await EmployeeModel.findById(n);
    if (!emp) return fail(res, `Employee #${n} not found`, 404);
    await EmployeeModel.remove(n);
    res.json({ message: `Employee ${emp.empeno} deleted` });
  },
};

const LookupController = {
  /** GET /api/lookups */
  async all(_req, res) {
    res.json(await LookupModel.all());
  },
};

module.exports = { EmployeeController, LookupController };
