// One-time restructuring helper; keeps the existing customer schema and validation.
const fs = require('fs');
const write = (p, s) => { fs.mkdirSync(require('path').dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const read = p => fs.readFileSync(p, 'utf8');
const setup = read('backend/setup.js');
const tables = Function(setup.slice(setup.indexOf('const TABLES ='), setup.indexOf('// Table definitions')) + '; return TABLES;')();
write('backend/migrations/001_initial.sql', ['usdmast','sysmast','repmast','cusmast'].map(name => 'CREATE TABLE IF NOT EXISTS ' + name + ' (\n  ' + tables[name].join(',\n  ').replace(/SERIAL PRIMARY KEY/g, 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY') + '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;').join('\n\n'));
const lists = Function(setup.slice(setup.indexOf('const lists ='), setup.indexOf("await seed('INSERT INTO sysmast")) + '; return lists;')();
write('backend/seed/lookups.json', JSON.stringify(lists, null, 2));
// Separate HTTP handlers, routing, validation and SQL into MVC folders.
for (const entity of ['customers', 'users']) {
  let source = read('backend/' + entity + '.js').replace(/\$\d+/g, '?');
  source = source.replace("const express = require('express');", '').replace("const router = express.Router();", '').replace("require('./db')", "require('../models/database')").replace("require('./auth')", "require('../utils/user')");
  source = source.replace('cuscus::bigint', 'CAST(cuscus AS UNSIGNED)').replace("cuscus ~", 'cuscus REGEXP');
  const routes = [];
  source = source.replace(/router\.(get|post|put|delete)\('([^']*)', async \(req, res\) => \{([\s\S]*?)\n\}\);/g, (_, method, path, body) => {
    const name = method + (path === '/' ? 'All' : path === '/:id' ? 'One' : path.replace(/\W/g, '_'));
    routes.push(`router.${method}('${path}', controller.${name});`);
    return `exports.${name} = async (req, res) => {${body}\n};`;
  });
  source = source.replace('module.exports = router;', '');
  // Move all query calls into a domain model. Only SQL parameters cross the boundary.
  const queries = [];
  source = source.replace(/pool\.query\(\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`[^`]*`)(?:,\s*(\[[^\]]*\]))?\s*\)/g, (_, sql, params) => {
    const name = 'query' + (queries.length + 1);
    queries.push(`exports.${name} = (params = []) => pool.query(${sql}, params);`);
    return `model.${name}(${params || ''})`;
  });
  source = source.replace("const { pool, nowLocal, insertRow, updateRow }", "const { nowLocal, insertRow, updateRow }");
  source = `const model = require('../models/${entity}Model');\n` + source;
  write(`backend/controllers/${entity}Controller.js`, source);
  write(`backend/models/${entity}Model.js`, `// SQL for ${entity}; ? placeholders keep user input separate from SQL.\nconst { pool } = require('./database');\nconst CATEGORY_TYPE = 16;\nconst CREDIT_TERMS_TYPE = 410;\n` + queries.join('\n\n'));
  write(`backend/routes/${entity}Routes.js`, `const router = require('express').Router();\nconst controller = require('../controllers/${entity}Controller');\n${routes.join('\n')}\nmodule.exports = router;\n`);
}
let auth = read('backend/auth.js');
const safe = auth.slice(auth.indexOf('function safeUser'), auth.indexOf('// POST'));
write('backend/utils/user.js', safe + '\nmodule.exports = { safeUser };\n');
auth = auth.replace(safe, '').replace("const { pool } = require('./db');", "const model = require('../models/authModel');\nconst { safeUser } = require('../utils/user');");
auth = auth.replace("const express = require('express');", '').replace('const router = express.Router();', '').replace("const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';", "const SECRET = process.env.JWT_SECRET;\nif (!SECRET) throw new Error('Set JWT_SECRET in backend/.env');");
auth = auth.replace(/const \{ rows \} = await pool.query\([\s\S]*?\[code\]\s*\);/, 'const { rows } = await model.findByCode(code);').replace("await pool.query('SELECT * FROM usdmast WHERE usdsno = $1', [payload.id])", 'await model.findById(payload.id)');
auth = auth.replace("router.post('/login', async (req, res) => {", 'async function login(req, res) {').replace("\n});\n\n// Middleware", '\n}\n\n// Middleware');
auth = auth.slice(0, auth.indexOf('// GET /api/auth/me')) + '\nmodule.exports = { login, loginRequired, adminOnly };\n';
auth = auth.replace("message: 'Invalid User Code'", "message: 'Invalid user code or password'").replace("message: 'Invalid Password'", "message: 'Invalid user code or password'");
write('backend/controllers/authController.js', auth.slice(0, auth.indexOf('// Middleware')) + '\nmodule.exports = { login };\n');
write('backend/middleware/auth.js', "const jwt = require('jsonwebtoken');\nconst model = require('../models/authModel');\nconst { safeUser } = require('../utils/user');\nconst SECRET = process.env.JWT_SECRET;\n" + auth.slice(auth.indexOf('// Middleware'), auth.lastIndexOf('module.exports')) + '\nmodule.exports = { loginRequired, adminOnly };\n');
write('backend/models/authModel.js', `const { pool } = require('./database');
exports.findByCode = code => pool.query("SELECT * FROM usdmast WHERE usdusd = ? AND usdactflg <> 'N' ORDER BY usdcomsno LIMIT 1", [code]);
exports.findById = id => pool.query('SELECT * FROM usdmast WHERE usdsno = ?', [id]);
`);
const bp = JSON.parse(read('backend/package.json'));
bp.name = 'srtbf-backend'; bp.description = 'SRTBF chicken farm - Express MVC and MySQL'; delete bp.dependencies.pg; bp.dependencies.mysql2 = '^3.15.3';
bp.scripts['db:migrate'] = 'node scripts/migrate.js'; bp.scripts['db:seed'] = 'node scripts/seed.js'; bp.scripts['db:setup'] = 'npm run db:migrate && npm run db:seed'; bp.scripts['db:import-customers'] = 'node scripts/import-customers.js';
write('backend/package.json', JSON.stringify(bp, null, 2));
const fp = JSON.parse(read('frontend/package.json')); fp.name = 'srtbf-frontend'; fp.devDependencies.tailwindcss = '^4.1.0'; fp.devDependencies['@tailwindcss/vite'] = '^4.1.0'; fp.dependencies['lucide-react'] = '^0.468.0';
write('frontend/package.json', JSON.stringify(fp, null, 2));
write('frontend/src/api.js', read('frontend/src/api.js').replace("'http://localhost:5000'", "import.meta.env.VITE_API_URL || ''"));
write('frontend/src/helpers.js', read('frontend/src/helpers.js').replace('JW Africa','SRTBF'));
let app = read('frontend/src/App.jsx').replace(/^import Expire.*\r?\n/gm, '').replace(/\s*\{\/\* Expire Module \*\/\}[\s\S]*?(?=\{\/\* Customers)/, '\n        ');
write('frontend/src/App.jsx', app);
write('frontend/vite.config.js', read('frontend/vite.config.js').replace("import react", "import tailwindcss from '@tailwindcss/vite';\nimport react").replace('plugins: [react()]', 'plugins: [react(), tailwindcss()]'));
write('frontend/src/main.jsx', "import './styles.css';\n" + read('frontend/src/main.jsx'));
