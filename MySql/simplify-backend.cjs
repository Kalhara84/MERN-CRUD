const fs = require('fs');
const read = name => fs.readFileSync('backend/' + name, 'utf8');
const write = (name, text) => fs.writeFileSync('backend/' + name, text.replace(/\n{3,}/g, '\n\n'));

// Inline each model query at its call site so a beginner can follow one file.
function inlineQueries(source, modelFile) {
  const model = read(modelFile);
  const expressions = [...model.matchAll(/exports\.(\w+) = \(params = \[\]\) => pool\.query\(\s*([\s\S]*?), params\s*\);/g)];
  for (const [, name, sql] of expressions) {
    source = source.replace(new RegExp('model\\.' + name + '\\((\\[[^\\]]*\\])?\\)', 'g'), (_, params) => `pool.execute(${sql}${params ? ', ' + params : ''})`);
  }
  if (/model\./.test(source)) throw new Error('Unconverted model call');
  return source.replace(/const \{ rows \} =/g, 'const [rows] =');
}

for (const entity of ['customers', 'users']) {
  let source = read(`controllers/${entity}Controller.js`);
  source = source.replace(/^const model = .*\r?\n/, '');
  source = source.replace("const { nowLocal, insertRow, updateRow } = require('../models/database');", "const router = require('express').Router();\nconst { pool, nowLocal, insertRow, updateRow } = require('./db');");
  source = source.replace("require('../utils/user')", "require('./auth')");
  source = inlineQueries(source, `models/${entity}Model.js`);
  const routes = [...read(`routes/${entity}Routes.js`).matchAll(/router\.(\w+)\('([^']*)', controller\.(\w+)\);/g)];
  for (const [, method, url, handler] of routes) {
    source = source.replace(new RegExp('exports\\.' + handler + ' = async \\(req, res\\) => \\{([\\s\\S]*?)\\n\\};'), (_, body) => `router.${method}('${url}', async (req, res) => {${body}\n});`);
  }
  source = source.replace('const [cat, credit, rep] = await Promise.all(', 'const [[cat], [credit], [rep]] = await Promise.all(').replaceAll('cat.rows.map', 'cat.map').replaceAll('credit.rows.map', 'credit.map').replaceAll('rep.rows.map', 'rep.map');
  write(entity + '.js', source + '\nmodule.exports = router;\n');
}

let config = read('config/database.js').replace("path.join(__dirname, '../.env')", "path.join(__dirname, '.env')").replace('module.exports = {', 'const config = {');
let db = read('models/database.js');
db = db.slice(db.indexOf('function nowLocal()'));
db = db.replaceAll('pool.query(', 'pool.execute(').replace('module.exports = { pool, nowLocal, insertRow, updateRow };', 'module.exports = { config, pool, nowLocal, insertRow, updateRow };');
write('db.js', config + "\nconst mysql = require('mysql2/promise');\nconst pool = mysql.createPool({ ...config, connectionLimit: 10 });\n\n" + db);

let auth = read('controllers/authController.js').replace("const model = require('../models/authModel');", "const { pool } = require('./db');\nconst router = require('express').Router();").replace("const { safeUser } = require('../utils/user');", '');
auth = auth.replace('const { rows } = await model.findByCode(code);', 'const [rows] = await pool.execute("SELECT * FROM usdmast WHERE usdusd = ? AND usdactflg <> \'N\' ORDER BY usdcomsno LIMIT 1", [code]);').replace('module.exports = { login };', '');
const safe = read('utils/user.js').replace('module.exports = { safeUser };', '');
let middleware = read('middleware/auth.js');
middleware = middleware.slice(middleware.indexOf('// Middleware:')).replace('const { rows } = await model.findById(payload.id);', "const [rows] = await pool.execute('SELECT * FROM usdmast WHERE usdsno = ?', [payload.id]);").replace('module.exports = { loginRequired, adminOnly };', '');
write('auth.js', auth + '\n' + safe + '\n' + middleware + "\nrouter.post('/login', login);\nrouter.get('/me', loginRequired, (req, res) => res.json({ user: req.user }));\nmodule.exports = { router, loginRequired, adminOnly, safeUser };\n");

const dashboardModel = read('models/dashboardModel.js');
const sqlFor = name => {
  const match = dashboardModel.match(new RegExp('exports\\.' + name + ' = \\(\\) => pool\\.query\\(\\s*([\\s\\S]*?)\\s*\\);'));
  if (!match) throw new Error('Missing dashboard query');
  return match[1];
};
write('dashboard.js', `// Dashboard totals come directly from the customers and users tables.
const router = require('express').Router();
const { pool } = require('./db');

router.get('/', async (req, res) => {
  const [customers] = await pool.execute(${sqlFor('customers')});
  const [categories] = await pool.execute(${sqlFor('categories')});
  const [months] = await pool.execute(${sqlFor('months')});
  const [recent] = await pool.execute(${sqlFor('recent')});
  let users = null;
  if (req.user.is_admin) {
    const [rows] = await pool.execute(${sqlFor('users')});
    users = rows[0];
  }
  res.json({ customers: customers[0], users, categories, months, recent });
});
module.exports = router;
`);

let app = read('app.js').replace("require('./config/database');", "// Start here: connect the database, register the API URLs, then listen.\nconst { pool } = require('./db');").replace("require('./middleware/auth')", "require('./auth')").replace("require('./routes/authRoutes')", "require('./auth').router").replace("require('./routes/customersRoutes')", "require('./customers')").replace("require('./routes/usersRoutes')", "require('./users')").replace("app.get('/api/dashboard', loginRequired, require('./controllers/dashboardController').summary);", "app.use('/api/dashboard', loginRequired, require('./dashboard'));");
app = app.replace('module.exports = app;', `// Importing this file for a check does not start a second server.
if (require.main === module) {
  const port = process.env.PORT || 5000;
  pool.execute('SELECT 1').then(() => {
    app.listen(port, () => console.log('SRTBF API on http://localhost:' + port + ' (MySQL connected)'));
  }).catch(error => {
    console.error('Cannot connect to MySQL. Check backend/.env:', error.message);
    process.exitCode = 1;
    pool.end();
  });
}
module.exports = app;`);
write('server.js', app);

let migrate = read('migrations/migrate.js');
migrate = migrate.slice(migrate.indexOf('async function migrate()'), migrate.lastIndexOf('migrate().catch'));
migrate = migrate.replace("path.join(__dirname, '../migrations')", "path.join(__dirname, 'migrations')");
let seed = read('seed/seed.js');
seed = seed.slice(seed.indexOf('async function seed()'), seed.lastIndexOf('seed().catch')).replace("require('../seed/lookups.json')", "require('./seed/lookups.json')").replace('const { rows } =', 'const [rows] =').replaceAll('pool.query(', 'pool.execute(');
let importer = read('seed/import-customers.js');
importer = importer.slice(importer.indexOf('async function run()'), importer.lastIndexOf('run().catch')).replace('async function run()', 'async function importCustomers()').replace('  let added = 0;', "  const customers = require('./seed/customers.json');\n  let added = 0;").replace('const { rows } =', 'const [rows] =').replaceAll('pool.query(', 'pool.execute(');
write('setup.js', `// Database setup only. Normal app startup uses server.js.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { config, pool, nowLocal, insertRow } = require('./db');

${migrate}
${seed}
${importer}
async function main() {
  const command = process.argv[2] || 'setup';
  if (command === 'setup') { await migrate(); await seed(); }
  else if (command === 'migrate') await migrate();
  else if (command === 'seed') await seed();
  else if (command === 'import') await importCustomers();
  else throw new Error('Use: node setup.js [setup|migrate|seed|import]');
}
main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
`);
const pkg = JSON.parse(read('package.json'));
pkg.description = 'SRTBF chicken farm - simple Express and MySQL API';
pkg.scripts['db:setup'] = 'node setup.js';
pkg.scripts['db:migrate'] = 'node setup.js migrate';
pkg.scripts['db:seed'] = 'node setup.js seed';
pkg.scripts['db:import-customers'] = 'node setup.js import';
write('package.json', JSON.stringify(pkg, null, 2) + '\n');
