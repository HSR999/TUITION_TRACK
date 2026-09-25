# TuitionTrack

TuitionTrack is a full-stack tuition-management application for teachers,
coaching institutes, and private tutors. It provides one workspace for
managing students, fees, attendance, expenses, reminders, notifications, and
payment receipts.

The application has a polished React dashboard with a light glassmorphism
interface, responsive layouts, toast feedback, dashboard analytics, fee due
insights, a working calendar, and profile/logout controls.

## Live deployment

- **Vercel deployment:** [Open the TuitionTrack Vercel project](https://tuition-track.vercel.app/)

The Vercel project hosts the frontend. Login and dashboard data also require a
deployed backend API. Set the Vercel project environment variable
`VITE_API_URL` to the public backend URL ending in `/api`, then redeploy the
frontend. Do not use `http://localhost:5000/api` in Vercel because
`localhost` means the visitor's own computer.

## Quick access: demo mode

Demo mode is the easiest way to preview the complete application without
creating a MongoDB database.

### Demo login

```text
Email:    demo@tuitiontrack.com
Password: Demo@12345
```

The login page also has a **Use demo account** button that fills in these
credentials automatically.

### Start the demo locally

Open two PowerShell terminals from the repository root.

Terminal 1 - demo API:

```powershell
cd backend
npm install
npm run demo
```

The demo API runs at `http://localhost:5000`.

Terminal 2 - frontend:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173` and sign in using the demo credentials above.

Demo mode includes sample students, fee records, attendance, expenses,
dashboard metrics, calendar due dates, and notification history. Demo data is
stored in memory, so changes are reset when the demo API restarts.

## What the application does

- **Dashboard:** student count, fee collection, pending dues, attendance,
  expenses, net profit, revenue trends, activity, and fee due calendar.
- **Students:** add, edit, search, filter, and delete student records.
- **Fees:** track paid, partial, and due amounts by month; record payments;
  generate receipt numbers; and open reminder actions.
- **Attendance:** mark attendance by date and class.
- **Expenses:** manage monthly tuition-business expenses.
- **Notifications:** review reminder history and delivery status.
- **Reminder studio:** customize parent messages with placeholders such as
  `{studentName}`, `{parentName}`, `{amountDue}`, `{month}`, `{dueDate}`, and
  `{teacherName}`.
- **Receipts:** create downloadable PDF payment receipts in the browser.
- **Institute and team management:** manage institute information and team
  access where enabled by the backend.
- **Authentication:** JWT-based login, registration, protected routes, and
  logout.

## Project structure

```text
Tuition_Track/
├── backend/
│   ├── config/          MongoDB connection
│   ├── middleware/      Authentication and request protection
│   ├── models/          Mongoose database models
│   ├── routes/          Auth, students, fees, attendance, etc.
│   ├── scripts/         Database seed scripts
│   ├── services/        Reminder and application services
│   ├── utils/           Shared backend helpers
│   ├── server.js        Production MongoDB API
│   ├── server.demo.js   In-memory demo API
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/          Axios API client
│   │   ├── components/   Shared UI components
│   │   ├── context/      Auth and toast state
│   │   ├── pages/        Dashboard and application pages
│   │   └── utils/        Formatting and reminder helpers
│   └── package.json
└── README.md
```

## Production local setup

Production mode uses Express, MongoDB Atlas, JWT authentication, and the
backend's configured reminder services.

### 1. Configure the backend

Copy the example environment file:

```powershell
cd backend
Copy-Item .env.example .env
```

Fill in `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/tuitiontrack
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
UPCOMING_REMINDER_DAYS=3
```

Keep `.env` private. Never commit passwords, database URLs, JWT secrets, or
email credentials.

Install and start the API:

```powershell
npm install
npm run dev
```

### 2. Configure the frontend

In a second terminal:

```powershell
cd frontend
Copy-Item .env.example .env
```

Set the API URL in `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Then start the frontend:

```powershell
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Database and demo seed

For a MongoDB-backed local environment, the backend includes a demo seed
script. Configure `MONGO_URI` first, then run:

```powershell
cd backend
npm run seed:demo
```

This creates the demo teacher and sample records in MongoDB:

```text
Email:    demo@tuitiontrack.com
Password: Demo@12345
```

Use `npm run demo` instead if you want an in-memory preview with no database.

## Important environment variables

### Backend

| Variable | Purpose |
| --- | --- |
| `PORT` | API port; defaults to `5000` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign login tokens |
| `JWT_EXPIRES_IN` | JWT lifetime, for example `7d` |
| `FRONTEND_URL` | Allowed frontend origin for CORS |
| `UPCOMING_REMINDER_DAYS` | Days before a fee due date to include in reminders |

### Frontend

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend API URL ending with `/api` |

## API overview

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/dashboard

GET    /api/students
POST   /api/students
PUT    /api/students/:id
DELETE /api/students/:id

GET    /api/fees
PUT    /api/fees/:studentId/:month

GET    /api/attendance
PUT    /api/attendance/mark

GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id

GET    /api/notifications
POST   /api/notifications/send/:studentId
```

Protected endpoints require the JWT returned by login:

```text
Authorization: Bearer <token>
```

## Deployment

### Backend on Render

Create a Render Web Service connected to this repository:

```text
Root directory: backend
Build command: npm install
Start command: npm start
```

Add the backend environment variables, using your MongoDB Atlas connection
string. Set `FRONTEND_URL` to the final Vercel URL.

For the current deployment, use:

```text
FRONTEND_URL=https://tuition-track.vercel.app
```

Do not use the Vercel project dashboard URL as `FRONTEND_URL`; it must be the
public website origin where the React app is running.

Copy the Render service URL and configure the Vercel project:

```text
VITE_API_URL=https://your-render-service.onrender.com/api
```

In Vercel, open **Settings -> Environment Variables**, add the variable for
the Production environment, save it, and redeploy. The frontend build embeds
Vite variables at build time, so changing the variable without redeploying
does not update the deployed website.

### Frontend on Vercel

Import the same repository into Vercel:

```text
Root directory: frontend
Build command: npm run build
Output directory: dist
```

Set:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

After deployment, copy the Vercel URL back into Render's `FRONTEND_URL` and
redeploy the backend.

Free hosting services may sleep when inactive. In-process scheduled jobs
should therefore not be relied on for production-critical reminders unless the
backend uses an always-on instance or an external scheduler.

## Useful commands

From `backend/`:

```powershell
npm run dev       # MongoDB API with nodemon
npm start         # MongoDB API
npm run demo      # In-memory demo API
npm run seed:demo # Seed demo records into MongoDB
```

From `frontend/`:

```powershell
npm run dev       # Vite development server
npm run build     # Production build
npm run preview   # Preview the production build locally
```

## Security notes

- Use a strong, unique `JWT_SECRET` in production.
- Restrict MongoDB Atlas Network Access whenever possible.
- Use a least-privilege MongoDB user.
- Do not commit `.env` files.
- Replace all demo credentials before using the project with real users.
- Configure the production frontend origin in `FRONTEND_URL`.

## Technology stack

- React 19
- Vite
- React Router
- Axios
- Recharts
- jsPDF
- Node.js
- Express
- MongoDB and Mongoose
- JWT
- bcryptjs
- node-cron

## License

This project is currently maintained as a private application repository. Add
the appropriate license before distributing it publicly.
