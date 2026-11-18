const fs = require('fs');
const write = (p, s) => fs.writeFileSync(p, s);
write('backend/server.js', `const app = require('./app');
const { pool } = require('./models/database');
const port = process.env.PORT || 5000;
pool.query('SELECT 1').then(() => {
  app.listen(port, () => console.log('SRTBF API on http://localhost:' + port + ' (MySQL connected)'));
}).catch(error => {
  console.error('Cannot connect to MySQL. Start MySQL and check backend/.env:', error.message);
  process.exit(1);
});
`);
write('backend/.env.example', `PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=srtbf_farm
DB_USER=root
DB_PASSWORD=
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:5174
ADMIN_CODE=ADMIN
ADMIN_PASSWORD=choose-your-own-password
`);
for (const [entity, names] of Object.entries({ customers: ['categories','creditTerms','representatives','nextCode','list','find','codeExists','remove'], users: ['codeExists','find','list','remove'] })) {
  for (const file of [`backend/models/${entity}Model.js`, `backend/controllers/${entity}Controller.js`]) {
    let text = fs.readFileSync(file, 'utf8');
    names.forEach((name, i) => { text = text.replaceAll('query' + (i + 1), name); });
    write(file, text);
  }
}
// Convert retained forms and tables to Tailwind utilities. No Bootstrap runtime or assets.
const classes = {
 'jw-card': 'rounded-2xl border border-stone-200 bg-white shadow-sm', 'jw-card-head': 'flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 p-5', 'jw-card-body': 'p-5',
 'row': 'grid grid-cols-12', 'g-3': 'gap-5', 'col-12': 'col-span-12', 'col-md-6': 'col-span-12 md:col-span-6', 'col-xl-4': 'xl:col-span-4', 'col-6': 'col-span-6', 'col-md-4': 'md:col-span-4', 'col-xl-3': 'xl:col-span-3',
 'd-flex': 'flex', 'align-items-center': 'items-center', 'align-items-end': 'items-end', 'justify-content-between': 'justify-between', 'justify-content-center': 'justify-center', 'align-self-center': 'self-center',
 'fw-semibold': 'font-semibold', 'fw-normal': 'font-normal', 'text-muted': 'text-stone-500', 'text-danger': 'text-red-600', 'text-end': 'text-right', 'text-nowrap': 'whitespace-nowrap', 'small': 'text-sm',
 'table-responsive': 'overflow-x-auto', 'table': 'w-full text-left text-sm', 'jw-table': '', 'align-middle': '', 'table-sm': '',
 'btn': 'button', 'btn-primary': 'button-primary', 'btn-light': 'button-light', 'btn-danger': 'button-danger', 'btn-outline-danger': 'button-danger', 'btn-outline-gold': 'button-light', 'btn-outline-secondary': 'button-light', 'btn-sm': 'text-xs',
 'form-control': 'field', 'form-select': 'field', 'form-control-sm': '', 'form-label': 'mb-2 block text-sm', 'form-text': 'mt-1 text-xs text-stone-500', 'form-check': 'flex items-center gap-2 py-2', 'form-switch': '', 'form-check-input': 'h-4 w-4 accent-green-700', 'form-check-label': 'text-sm', 'is-invalid': 'border-red-500',
 'badge': 'inline-flex rounded-full px-2.5 py-1 text-xs font-medium', 'text-bg-danger': 'bg-red-50 text-red-700', 'text-bg-success': 'bg-green-50 text-green-700', 'text-bg-dark': 'bg-stone-100 text-stone-700', 'ms-1': 'ml-1', 'w-25': 'w-1/4', 'vh-100': 'min-h-screen', 'spinner-border': 'spinner', 'alert': 'rounded-xl p-4', 'alert-danger': 'bg-red-50 text-red-700'
};
for (const name of ['CustomerListPage','CustomerFormPage','UserListPage','UserFormPage','../App']) {
 const path = name === '../App' ? 'frontend/src/App.jsx' : `frontend/src/pages/${name}.jsx`;
 let text = fs.readFileSync(path, 'utf8');
 for (const [old, value] of Object.entries(classes)) text = text.replace(new RegExp('(?<![\\w-])' + old + '(?![\\w-])', 'g'), value);
 text = text.replace(/<i className="bi bi-eye" \/>/g, 'View').replace(/<i className="bi bi-pencil" \/>/g, 'Edit').replace(/<i className="bi bi-trash" \/>/g, 'Delete').replace(/<i className="bi bi-plus-lg" \/>/g, '+').replace(/<i className="bi [^"]+" \/>/g, '');
 text = text.replace('Customer master', 'Customer directory').replace('User master', 'Your farm team');
 text = text.replace('placeholder="Search..."', 'aria-label="Search records" placeholder="Search records..."');
 write(path, text);
}
write('frontend/index.html', `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="theme-color" content="#2f633f" /><meta name="description" content="SRTBF chicken farm customer and team management" /><title>SRTBF | Farm management</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`);
