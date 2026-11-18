# SRTBF Chicken Farm

A simple React + Tailwind frontend and Express + MySQL backend. The application contains a dashboard, Customers and Users. Users are managed by administrators; all signed-in staff can manage customers.

## This computer

The project is configured for an isolated local MySQL database at `127.0.0.1:3307`, with its data in `.local-mysql/data`. Existing WAMP databases were not modified. The previous PostgreSQL configuration is saved privately in `backend/.env.postgresql.backup`.

Login with `ADMIN_CODE` and `ADMIN_PASSWORD` from `backend/.env`. Passwords and JWT secrets are not committed. The seeded administrator password is stored as a bcrypt hash in MySQL.

If the local database is stopped, start it from the project root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-local-mysql.ps1
```

Start the API in one terminal:

```powershell
cd backend
npm.cmd run dev
```

Start the frontend in another terminal:

```powershell
cd frontend
npm.cmd run dev
```

Open **http://localhost:5174**. The API runs at **http://localhost:5000**. Vite forwards `/api` requests to the backend.

## Setup on another computer

1. Install Node.js and MySQL (MySQL 8 recommended; this computer was tested with its installed MySQL 5.7).
2. Start MySQL. Copy `backend/.env.example` to `backend/.env` and set your database host, port, username and password. Set a random `JWT_SECRET` and choose your own `ADMIN_PASSWORD` (at least 8 characters).
3. In `backend`, run:

   ```powershell
   npm.cmd install
   npm.cmd run db:setup
   npm.cmd run db:import-customers
   npm.cmd run dev
   ```

4. In `frontend`, run `npm.cmd install`, then `npm.cmd run dev`.

The migration command creates the configured database if it does not exist; the MySQL account needs permission to create a database and tables. You can instead create the database yourself and grant access to that database.

## Beginner-friendly folder structure

```text
backend/
  server.js                    Start the server after checking MySQL
  app.js                       Connect routes and error handling
  config/database.js           Read connection settings from .env
  routes/                      Match URLs to controller functions
  controllers/                 Validate forms and prepare responses
  models/                      MySQL queries and database helpers
  middleware/auth.js           Check login and administrator access
  utils/user.js                Remove password hashes from responses
  migrations/001_initial.sql   Versioned table definitions
  scripts/migrate.js           Apply unapplied migrations
  scripts/seed.js              Add lookups and the first administrator
  scripts/import-customers.js  Import the existing customer JSON
  scripts/smoke-test.js        Real API + database integration checks
  seed/                       Existing customer data and lookup values
frontend/
  src/App.jsx                  Login state and page routes
  src/api.js                   Shared API requests
  src/styles.css               Tailwind and reusable component styles
  src/components/              Sidebar/layout and accessible dialogs
  src/pages/                   Login, dashboard, customer/user lists and forms
  public/images/farm.jpg       Local chicken farm photograph
scripts/start-local-mysql.ps1   Optional startup for this computer's local DB
```

Request flow: **React page → route → controller → model → MySQL → JSON response**. React is the View in this MVC setup. The legacy field names are retained to keep existing customer data compatible. Models use MySQL `?` placeholders so entered values are separate from SQL.

## Migrations and customer data

- `npm.cmd run db:migrate`: applies numbered SQL files in order and records them in `migrations`. Re-running skips completed files.
- `npm.cmd run db:seed`: adds lookup values and creates the first administrator only when there are no users. It never resets existing passwords.
- `npm.cmd run db:import-customers`: imports `seed/customers.json`, skipping existing customer codes. MySQL assigns IDs automatically. Existing records are not overwritten.
- For a schema change, add a new numbered file such as `002_add_customer_field.sql`; do not change an already applied migration. MySQL DDL auto-commits, so write restart-safe migrations and back up data before schema changes. Automatic rollback is deliberately not provided.

The bundled 730 customers are imported into the local database. This is an import from the provided JSON, not a live PostgreSQL transfer. Existing PostgreSQL users are not migrated; create them using Users. Missing legacy category names remain “Uncategorized” instead of inventing mappings.

## Dashboard reports

- Total and active customer counts, combined credit limits in LKR, and team counts for administrators.
- A bar chart of customer creation dates over the last six months, including zero months.
- An active/inactive customer doughnut chart and category summary bars.
- Recent customer records and contact-detail coverage.
- **Export report** opens the browser print dialog; choose Save as PDF to save a report.

All report figures come from MySQL. Credit limits are allowances, not revenue, sales or unpaid balances. Most imported records are older, so the recent-month chart can correctly show zero.

## Checks

```powershell
cd backend
npm.cmd test
```

The integration checks use `ADMIN_CODE` / `ADMIN_PASSWORD`, create uniquely named temporary customer/user records, check CRUD, validation, permissions and dashboard totals, and remove only those test records afterwards.

```powershell
cd frontend
npm.cmd run build
```

For separate frontend hosting, set `VITE_API_URL` to the API origin before building and set `FRONTEND_URL` on the backend. The old Bootstrap, jewellery theme and Expire module are removed.

Implementation references: [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite), [MySQL2 promise API](https://sidorares.github.io/node-mysql2/docs/documentation/promise-wrapper).
