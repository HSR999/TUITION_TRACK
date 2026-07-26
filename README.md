# TuitionTrack

TuitionTrack is a full-stack MERN tuition-management application for teachers. It manages students, monthly fees, attendance, expenses, dashboards, email reminders, notification history, and PDF receipts.

## 1. How the application is divided

The application has two separate programs:

- `backend/` is an Express API. It validates requests, applies business rules, communicates with MongoDB, sends emails, and returns JSON.
- `frontend/` is a React/Vite app. It displays pages, gathers form input, calls the API with Axios, and stores the login token.

The main request flow is:

```text
React page -> Axios -> Express route -> JWT middleware -> Mongoose model -> MongoDB Atlas
```

## 2. Run locally

### Backend

Copy `backend/.env.example` to `backend/.env` and insert real values. Never commit `.env`.

```powershell
cd backend
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

### Frontend

Copy `frontend/.env.example` to `frontend/.env`.

```powershell
cd frontend
npm install
npm run dev
```

The website runs at `http://localhost:5173`.

If the global `npm` launcher on this Windows machine reports a missing `npm-cli.js`, this direct form uses the npm bundled with Node:

```powershell
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run dev
```

## 3. Environment variables

Backend:

- `MONGO_URI`: MongoDB Atlas connection string.
- `JWT_SECRET`: private signing secret for login tokens.
- `JWT_EXPIRES_IN`: token lifetime, such as `7d`.
- `FRONTEND_URL`: allowed frontend origin. Multiple origins can be comma-separated.
- `EMAIL_SERVICE`: for example `gmail`.
- `EMAIL_USER` and `EMAIL_PASS`: SMTP account and app password.
- `EMAIL_FROM`: sender name/address shown to parents.

Frontend:

- `VITE_API_URL`: backend URL ending in `/api`.

## 4. Backend, step by step

### Server startup

`backend/server.js` loads environment variables, connects to Atlas, registers CORS/JSON middleware, mounts each route group, starts the reminder scheduler, and finally listens for HTTP requests.

### Database models

- `Teacher.js` hashes passwords before saving and provides `comparePassword()` for login.
- `Student.js` stores student, parent, class, fee, and due-day data.
- `FeeRecord.js` stores one record per student per `YYYY-MM` month.
- `Attendance.js` stores one present/absent result per student per date.
- `Expense.js` stores categorized business spending.
- `NotificationLog.js` records successful and failed reminder emails.

Every business model includes `teacherId`. Routes always query with the authenticated teacher ID, preventing one teacher from reading another teacher's data.

### Authentication

`routes/auth.js` provides register, login, and current-user endpoints. Login checks the bcrypt password and signs a JWT containing the teacher ID.

`middleware/protect.js` reads `Authorization: Bearer TOKEN`, verifies the signature/expiry, loads the teacher, and puts it on `req.teacher`. Every private route uses this middleware.

### Student CRUD

`routes/students.js` supports create, list, search, class filtering, update, and delete. Delete also removes the student's fee, attendance, and notification records.

### Monthly fees

`routes/fees.js` combines all students with the selected month's records. Missing records appear as due. Saving an amount creates or updates the monthly record and calculates `due`, `partial`, or `paid`. A changed positive payment receives a receipt number.

### Attendance

`routes/attendance.js` returns all students plus their selected-date status. Saving uses MongoDB `bulkWrite`, efficiently upserting the whole class in one request.

### Expenses and dashboard

`routes/expenses.js` implements monthly filtering and CRUD. `routes/dashboard.js` calculates student count, revenue, pending fees, expenses, net profit, attendance percentage, fee-status counts, and six-month chart data.

### Email reminders

`cronJobs.js` schedules the job for 8:00 AM in `Asia/Kolkata`. `services/reminderService.js` finds fees due in three days, skips fully paid students, and checks `NotificationLog` by parent email/month before sending. This also prevents siblings with the same parent email from receiving duplicate reminders.

`utils/email.js` owns Nodemailer configuration and the email template. Manual reminders use the same service, so manual and automatic messages produce consistent logs.

## 5. Frontend, step by step

### Entry and routing

`src/main.jsx` mounts React, the router, and authentication context. `src/App.jsx` defines public/private pages and lazy-loads pages to keep the initial bundle small.

### Authentication state

`context/AuthContext.jsx` handles register, login, logout, and session restoration. The JWT and basic teacher profile are kept in local storage.

`api/axios.js` supplies the API base URL and automatically adds the JWT to every request. A `401` response clears the expired session and returns to login.

### Pages

- Dashboard renders API statistics and a Recharts revenue graph.
- Students provides class cards, all-students view, search, and CRUD modal.
- Fees provides list/calendar views, payment status, receipts, and manual reminders.
- Attendance marks present/absent for a selected date/class.
- Expenses manages categorized spending and monthly totals.
- Receipts uses jsPDF to create printable payment PDFs in the browser.
- Notifications displays Nodemailer success/failure history.

Reusable UI lives in `src/components/`; shared date, currency, and error formatting lives in `src/utils/format.js`.

## 6. Main API routes

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/students?class=9&search=name
POST   /api/students
GET    /api/students/:id
PUT    /api/students/:id
DELETE /api/students/:id

GET    /api/fees?month=YYYY-MM&class=9
PUT    /api/fees/:studentId/:month

GET    /api/attendance?date=YYYY-MM-DD&class=9
PUT    /api/attendance/mark

GET    /api/expenses?month=YYYY-MM
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id

GET    /api/dashboard
GET    /api/notifications?month=YYYY-MM
POST   /api/notifications/send/:studentId
```

## 7. Deployment

### Render backend

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Add all backend environment variables.
- Set `FRONTEND_URL` to the final Vercel URL.

Render must be able to reach Atlas. Configure Atlas Network Access appropriately and use a dedicated least-privilege database user.

Important: a free Render web service may sleep when inactive. In-process `node-cron` cannot run while the service is asleep, so production-grade 8 AM delivery requires an always-running instance or an external scheduled service.

### Vercel frontend

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` to `https://YOUR-RENDER-SERVICE.onrender.com/api`.

After Vercel gives the final URL, update Render's `FRONTEND_URL` and redeploy the backend.
