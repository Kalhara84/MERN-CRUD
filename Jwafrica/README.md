# CURD Operation in PostgreSQL - Node.js + React version

The Django project is now split into two separate apps:

- `backend/`  - Node.js + Express REST API, PostgreSQL with Sequelize models
- `frontend/` - React (Vite) single page app, same gold theme / Bootstrap design as before

Features are the same: login/logout, dashboard, admin-only Users CRUD, Expire module
(header + lines, "Add Location" pop-up). The PostgreSQL tables and column names are unchanged,
so the same database (`django_test`) works.

## Folder structure

```
backend/
  .env.example
  package.json
  src/
    server.js            start the API
    app.js               Express setup (middleware + routes)
    config/              env.js (.env values), db.js (PostgreSQL connection)
    models/              one file per table + index.js (links between tables)
    controllers/         auth, dashboard, users, expire  (the old views.py / forms.py logic)
    routes/index.js      all API addresses              (the old urls.py)
    middleware/          auth.js (login_required / admin_required), errorHandler.js
    utils/               password.js, time.js, validate.js, httpError.js
    seeders/setup.js     creates tables + default data  (the old migrations)
frontend/
  index.html
  vite.config.js         /api is proxied to the backend in development
  public/assets/         bootstrap, icons, fonts, css, images (copied from the Django static folder)
  src/
    main.jsx, App.jsx    start + page addresses
    api/client.js        all calls to the backend
    context/             AuthContext (login user), FlashContext (green/red messages)
    components/          Layout (sidebar + top bar), ProtectedRoute, Modal, ConfirmDelete, AddLocationModal
    pages/               Login, Dashboard, UserList, UserForm, ExpireList, ExpireForm
```

## Django -> Node/React map

| Django                          | New                                                  |
|---------------------------------|------------------------------------------------------|
| `models.py`                     | `backend/src/models/*.js` (Sequelize)                |
| `views.py`, `expire_views.py`   | `backend/src/controllers/*.js`                       |
| `forms.py`, `expire_forms.py`   | validation inside the controllers + `utils/validate.js` |
| `urls.py`                       | `backend/src/routes/index.js` (API) + `frontend/src/App.jsx` (pages) |
| `decorators.py`                 | `backend/src/middleware/auth.js` + `ProtectedRoute.jsx` |
| `auth.py`                       | `backend/src/utils/password.js` + `authController.js` |
| `migrations/`                   | `backend/src/seeders/setup.js`                       |
| `templates/*.html`              | `frontend/src/pages/*.jsx` + `components/`           |
| `static/expire-form.js`         | `ExpireFormPage.jsx` + `AddLocationModal.jsx`        |
| session login                   | JWT token (14 days with "Remember me", otherwise until the browser closes) |

## Run it

Requirements: Node.js 18+ and a PostgreSQL server.

### 1. Backend

```bash
cd backend
cp .env.example .env        # then edit DB_PASSWORD, JWT_SECRET ...
npm install
npm run db:setup            # creates the tables + default users + sample combo box data
npm run dev                 # API on http://localhost:5000
```

Create the PostgreSQL database first if it does not exist (default name `django_test`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # open http://localhost:5173
```

### Default logins (same as before - change them after the first login)

- `2000` / `2000 rbf`
- `ADMIN` / `0777289242`

Passwords already saved by Django (`pbkdf2_sha256$...`) or old plain-text ones still work;
after a correct login they are saved again as a bcrypt hash.

## API (all under /api)

| Method | Address                | Who     | Purpose                              |
|--------|------------------------|---------|--------------------------------------|
| POST   | /auth/login            | public  | `{usdusd, usdpwd, remember}` -> token |
| GET    | /auth/me               | login   | current user                         |
| GET    | /dashboard             | login   | user counts (admin only get data)    |
| GET/POST | /users               | admin   | list / add                           |
| GET/PUT/DELETE | /users/:id     | admin   | one user / edit / delete             |
| GET    | /expire                | login   | list of entries                      |
| GET    | /expire/lookups        | login   | data for all combo boxes             |
| POST   | /expire/locations      | login   | add a location (pop-up)              |
| POST   | /expire                | login   | new entry (header + `lines[]`)       |
| GET/PUT/DELETE | /expire/:id    | login   | one entry / edit / delete (+ lines)  |

Send the token as `Authorization: Bearer <token>`.

## Production

- Backend: set `NODE_ENV=production`, a long `JWT_SECRET`, `CLIENT_URL` = your frontend address.
- Frontend: `npm run build`, upload `frontend/dist`, and set `VITE_API_URL` to the API address before building.
