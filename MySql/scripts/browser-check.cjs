// Optional local UI check using an isolated Chrome instance on debugging port 9223.
const fs = require('fs');
const assert = require('node:assert/strict');
const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function main() {
  const targets = await (await fetch('http://127.0.0.1:9223/json')).json();
  const target = targets.find(item => item.type === 'page');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const callback = pending.get(message.id);
      if (callback) { pending.delete(message.id); message.error ? callback.reject(message.error) : callback.resolve(message.result); }
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => { const key = ++id; pending.set(key, { resolve, reject }); socket.send(JSON.stringify({ id: key, method, params })); });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }
  async function waitFor(expression) {
    for (let attempt = 0; attempt < 40; attempt++) { if (await evaluate(expression)) return; await sleep(250); }
    throw new Error('UI condition timed out: ' + expression);
  }
  async function visit(url, expected) {
    await send('Page.navigate', { url });
    await waitFor(`document.body.innerText.includes(${JSON.stringify(expected)})`);
    await sleep(350);
  }
  async function screenshot(name) {
    fs.mkdirSync(path.join(__dirname, '../docs/screenshots'), { recursive: true });
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(path.join(__dirname, '../docs/screenshots', name + '.png'), Buffer.from(result.data, 'base64'));
  }
  try {
    await send('Runtime.enable'); await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await visit('http://localhost:5174', 'Good to see you again.');
    await screenshot('login');
    const credentials = { code: process.env.ADMIN_CODE, password: process.env.ADMIN_PASSWORD };
    await evaluate(`(() => { const credentials = ${JSON.stringify(credentials)}; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; for (const [id, value] of Object.entries(credentials)) { const input = document.getElementById(id); setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); } })()`);
    await evaluate("document.querySelector('form').requestSubmit()");
    await waitFor("document.body.innerText.includes('Farm overview')");
    await screenshot('dashboard');
    assert.equal(await evaluate("document.querySelectorAll('img').length > 0 && [...document.images].every(image => image.complete && image.naturalWidth > 0)"), true);
    await visit('http://localhost:5174/customers', 'Customer directory');
    await waitFor("document.querySelectorAll('tbody tr').length > 5");
    await screenshot('customers');
    await visit('http://localhost:5174/customers/add', 'Customer code');
    assert.equal(await evaluate("document.querySelector('#cuscus').value.length > 0"), true);
    await visit('http://localhost:5174/users', 'Your farm team');
    await visit('http://localhost:5174/users/add', 'User code (login name)');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await visit('http://localhost:5174', 'Farm overview');
    await screenshot('dashboard-mobile');
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'Dashboard must fit mobile width');
    await evaluate("document.querySelector('[aria-label=\"Toggle navigation\"]').click()");
    assert.equal(await evaluate("document.querySelector('[aria-label=\"Toggle navigation\"]').getAttribute('aria-expanded')"), 'true');
    await visit('http://localhost:5174/customers', 'Customer directory');
    await screenshot('customers-mobile');
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'Customers must fit mobile width');
    assert.deepEqual(errors, []);
    console.log('PASS: browser login, images, dashboard, customer list/add, user list/add, mobile navigation and responsive widths.');
  } finally { await send('Browser.close').catch(() => {}); socket.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
