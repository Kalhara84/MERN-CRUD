# CURD - simple version (Node.js + React + PostgreSQL)

Same screens as before: login, dashboard, Users (admin only), Expire Module (header + lines, "Add Location" pop-up).
The code is made small and plain, so a beginner can read it from top to bottom.

## Folders

```
backend/                 the API (Node.js + Express)
  server.js              starts the API and joins the files below
  db.js                  PostgreSQL connection + 2 helpers (insertRow, updateRow)
  auth.js                login + "is the user logged in?" checks
  users.js               Users page API   (list / add / edit / delete)
  expire.js              Expire Module API (entries, lines, combo boxes, Add Location)
  customers.js           Customers API    (list / add / edit / delete, combo boxes, next code)
  import-customers.js    loads the old customers from seed/customers.json   (npm run db:import-customers)
  seed/customers.json    the old customers (taken from the old database)
  setup.js               creates the tables + starting data   (npm run db:setup)

frontend/                the screens (React + Vite)
  public/assets/         bootstrap, icons, fonts, css, images  (no need to open these)
  src/
    main.jsx             starts React
    App.jsx              who is logged in + which page for which address
    api.js               the ONLY file that talks to the backend
    helpers.js           app name + date helpers
    components/          Layout.jsx (menu + top bar), Modal.jsx (pop-ups)
    pages/               Login, Dashboard, UserList, UserForm, ExpireList, ExpireForm, CustomerList, CustomerForm
```

## How one click travels (example: opening the Users page)

```
UserListPage.jsx   api.get('/users')
      |
api.js             sends  GET /api/users  + the login token
      |
server.js          /api/users  ->  loginRequired -> adminOnly -> users.js
      |
users.js           SELECT * FROM usdmast   (talks to PostgreSQL through db.js)
      |
UserListPage.jsx   gets the list, draws the table
```

## Run it

You need Node.js 18+ and a PostgreSQL server.

1. In PostgreSQL create an EMPTY database, for example `curd_simple`.

2. Backend
   ```bash
   cd backend
   cp .env.example .env      # open .env and set DB_NAME, DB_PASSWORD ...
   npm install
   npm run db:setup          # creates tables + 2 users + sample combo box data
   npm run db:import-customers   # (optional) loads the 730 old customers
   npm run dev               # API on http://localhost:5000
   ```

3. Frontend (second terminal)
   ```bash
   cd frontend
   npm install
   npm run dev               # open http://localhost:5173
   ```

Starting logins (change the passwords after the first login):

- `2000` / `2000 rbf`
- `ADMIN` / `0777289242`

## Good to know

- Use a NEW empty database. `setup.js` creates smaller tables than the old Django ones, so do not point it at the old `django_test` database.
- Old Django / plain-text passwords are not supported any more. All passwords are saved with bcrypt.
- Login uses a token. "Remember me" keeps it for 14 days, otherwise 12 hours.
- Deleting an Expire entry deletes its lines too (`ON DELETE CASCADE` in `setup.js`).
- Saving an Expire entry removes the old lines and saves the lines on the screen again, inside one transaction (all or nothing).
- Production: set a long `JWT_SECRET` in `.env`, and if the API is on another address set `VITE_API_URL` before `npm run build` in the frontend.
