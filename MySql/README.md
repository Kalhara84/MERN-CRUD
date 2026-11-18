# SRTBF Chicken Farm

React + Tailwind CSS frontend, a simple Node.js + Express backend, and MySQL.

## Files

```text
backend/
  server.js          Start Express and register the routes
  db.js              MySQL connection and shared helpers
  routes/            API URLs grouped by feature
    authRoutes.js
    customersRoutes.js
    usersRoutes.js
    dashboardRoutes.js
  auth.js            Login checking and administrator access
  controllers/       Validate requests and send responses
    authController.js
    customersController.js
    usersController.js
    dashboardController.js
  models/            SQL queries for each feature
    customersModel.js
    usersModel.js
    dashboardModel.js
  setup.js           Migrations, initial administrator and data import
  migrations/        SQL migration files
  seed/              Customer and lookup JSON data
frontend/
  src/
    App.jsx          React routes
    api.js           API requests
    components/      Shared layout and dialogs
    pages/           Login, dashboard, Customers and Users
    styles.css       Tailwind styles
  public/images/     Farm image used by the app
```

## Run

The project uses a small MVC structure:

- Model: SQL queries in `backend/models/`.
- View: React pages in `frontend/src/pages/`.
- Controller: request validation and responses in `backend/controllers/`.

Follow one request: React page -> route -> controller -> model -> MySQL.
Each feature has one route file, one controller and one model;
there are no additional service or repository layers. Authentication uses the user model.

Start MySQL and set the connection details in `backend/.env`.
The current database uses port **3307** and stores its data in `.local-mysql/data`.
Keep that directory: it contains the imported customer records, not generated images or test output.
For your own WAMP/MySQL server, set its port, username and password in `.env`.

Backend terminal:

```sh
cd backend
npm install
npm run db:setup
npm run dev
```

Frontend terminal:

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:5174. The API runs on port 5000.
On Windows, use `npm.cmd` if PowerShell blocks `npm`.

Login with the `ADMIN_CODE` and `ADMIN_PASSWORD` values in `backend/.env`.
For a fresh installation, copy `.env.example` to `.env` and set your own credentials first.

## Database commands

Run inside `backend`:

- `npm run db:migrate`: apply new SQL migrations.
- `npm run db:seed`: add the initial administrator and dropdown values.
- `npm run db:import-customers`: import the bundled customer records without duplicating existing codes.

The current database already contains 730 imported customers.

## Frontend build

Run `npm run build` inside `frontend` when you need deployment files.
The dashboard uses real customer data for charts and report summaries.
Users management is limited to administrators.
