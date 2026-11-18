// Integration checks against the configured MySQL database. Only temporary test rows are removed.
const assert = require('node:assert/strict');
const app = require('../app');
const { pool } = require('../models/database');
const { once } = require('node:events');
async function run() {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const suffix = Date.now();
  const userCode = 'TEST' + suffix;
  const customerCode = 'T' + suffix;
  async function request(path, method = 'GET', body, token) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json() };
  }
  try {
    assert.equal((await request('/customers')).status, 401);
    const login = await request('/auth/login', 'POST', { usdusd: process.env.ADMIN_CODE, usdpwd: process.env.ADMIN_PASSWORD });
    assert.equal(login.status, 200);
    assert.equal(login.data.user.usdpwd, undefined);
    const token = login.data.token;
    assert.equal((await request('/auth/me', 'GET', undefined, token)).status, 200);
    const customer = { cuscus: customerCode, cusnam: 'Integration test customer', cuscreditlimit: 1000, cusactyn: true };
    assert.equal((await request('/customers', 'POST', {}, token)).status, 422);
    assert.equal((await request('/customers', 'POST', customer, token)).status, 201);
    assert.equal((await request('/customers', 'POST', customer, token)).status, 422);
    const list = await request('/customers', 'GET', undefined, token);
    const saved = list.data.customers.find(row => row.cuscus === customerCode);
    assert.ok(saved);
    assert.equal((await request(`/customers/${saved.cussno}`, 'PUT', { ...customer, cusnam: 'Updated test customer' }, token)).status, 200);
    assert.equal((await request(`/customers/${saved.cussno}`, 'GET', undefined, token)).data.customer.cusnam, 'Updated test customer');
    assert.equal((await request('/customers/lookups', 'GET', undefined, token)).status, 200);
    assert.ok((await request('/customers/next-code', 'GET', undefined, token)).data.code);
    const user = { usdusd: userCode, usdnam: 'Integration test user', new_password: 'temporary-test-password', usdactflg: true, usdadmin: false, usdcomsno: 0, usddepsno: 0, usdlocsno: 0, usdatfliamt: 0, usdatfnosetday: 0 };
    assert.equal((await request('/users', 'POST', user, token)).status, 201);
    const users = await request('/users', 'GET', undefined, token);
    const savedUser = users.data.users.find(row => row.usdusd === userCode);
    assert.ok(savedUser);
    assert.equal(savedUser.usdpwd, undefined);
    const staff = await request('/auth/login', 'POST', { usdusd: userCode, usdpwd: user.new_password });
    assert.equal(staff.status, 200);
    assert.equal((await request('/users', 'GET', undefined, staff.data.token)).status, 403);
    assert.equal((await request('/dashboard', 'GET', undefined, staff.data.token)).data.users, null);
    assert.equal((await request(`/users/${savedUser.usdsno}`, 'PUT', { ...user, usdactflg: false, new_password: '' }, token)).status, 200);
    assert.equal((await request('/customers', 'GET', undefined, staff.data.token)).status, 401);
    assert.equal((await request(`/users/${login.data.user.usdsno}`, 'DELETE', undefined, token)).status, 400);
    const dashboard = await request('/dashboard', 'GET', undefined, token);
    assert.equal(dashboard.status, 200);
    assert.equal(Number(dashboard.data.customers.total), list.data.customers.length);
    assert.ok(Array.isArray(dashboard.data.months));
    assert.equal((await request(`/users/${savedUser.usdsno}`, 'DELETE', undefined, token)).status, 200);
    assert.equal((await request(`/customers/${saved.cussno}`, 'DELETE', undefined, token)).status, 200);
    assert.equal((await request(`/customers/${saved.cussno}`, 'GET', undefined, token)).status, 404);
    console.log('PASS: login, authentication, authorization, customer CRUD, user CRUD, validation, blocked sessions, dashboard totals and self-delete protection.');
  } finally {
    await pool.query('DELETE FROM cusmast WHERE cuscus = ?', [customerCode]);
    await pool.query('DELETE FROM usdmast WHERE usdusd = ?', [userCode]);
    await new Promise(resolve => server.close(resolve));
    await pool.end();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
