# Payroll System - Employee Module (100% Node.js + JavaScript)

| Part     | Technology                                              | Port |
|----------|---------------------------------------------------------|------|
| Backend  | **Node.js + Express** (plain JavaScript) + `pg`         | 3001 |
| Frontend | **Node.js + Express** static server + **vanilla JavaScript** SPA + Bootstrap 5 (violet/orange theme) | 3000 |
| Database | PostgreSQL                                              | 5432 |

No Next.js / React / TypeScript anywhere. Step-by-step guide to create it from scratch: **BUILD_GUIDE.md**.

## Frontend structure
```
frontend/server.js            Express: serves public/ + bootstrap + /config.js
frontend/public/index.html    page shell
frontend/public/css/style.css theme
frontend/public/js/           app.js (router), api.js, auth.js, ui.js, charts.js, pages/*.js
frontend/public/assets/       logo + SVG illustrations
```

## Backend structure (MVC)
```
backend/src/
  server.js / app.js          start + express setup (CORS, JSON)
  routes/index.js             all routes
  middleware.js               requireAuth (token), error handler
  controllers/                auth, dashboard, employee (+ lookups)
  models/                     SQL: user, lookup, employee, dashboard
  validators/employee.validator.js
  lib/db.js  lib/auth.js      pg pool, scrypt password + HMAC token (Node crypto)
```

## Run
Requirements: Node.js 20+ and PostgreSQL 13+.

```bash
psql -U postgres -c "CREATE DATABASE payroll_db;"
psql -U postgres -d payroll_db -f database/payroll_db.sql
```

Backend (terminal 1) - edit `backend/.env` first (DB password, AUTH_SECRET):
```bash
cd backend
npm install
npm run dev        # or: npm start
```
Open http://localhost:3001 -> "Payroll API is running".

Frontend (terminal 2):
```bash
cd frontend
npm install
npm run dev      # edit frontend/.env if the API address changes
```
Open http://localhost:3000 and sign in with **admin / 1234** (change this password for real use).

## API (all need `Authorization: Bearer <token>` except login)
| Method | URL | Purpose |
|--------|-----|---------|
| POST | /api/auth/login | `{username,password}` -> `{token,user}` |
| GET | /api/auth/me | current user |
| GET | /api/dashboard | dashboard numbers |
| GET | /api/lookups | dropdown data |
| GET | /api/employees?search=&page=&limit= | list |
| GET/PUT/DELETE | /api/employees/:id | one / update / delete |
| POST | /api/employees | add |

## UI / images
Old photos (`m0.jpg`, `m1.jpg`, `login_security.png`) were removed. New original SVG artwork is in `frontend/public/assets/`
(`login-hero.svg`, `banner.svg`, `empty.svg`, `shield.svg`, `favicon.svg`). The Mike Flora `logo.jpg` is kept.
Theme colours are CSS variables at the top of `frontend/src/app/globals.css`.

## Production
```bash
cd backend && npm start
cd frontend && npm start
```
