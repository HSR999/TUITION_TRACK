const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const startCronJobs = require("./cronJobs");

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/students");
const feeRoutes = require("./routes/fees");
const attendanceRoutes = require("./routes/attendance");
const expenseRoutes = require("./routes/expenses");
const dashboardRoutes = require("./routes/dashboard");
const notificationRoutes = require("./routes/notifications");
const teamRoutes = require("./routes/team");
const instituteRoutes = require("./routes/institute");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.FRONTEND_URL || "https://tuition-track.vercel.app")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => res.json({ message: "TuitionTrack API is running" }));
app.get("/api/health", (req, res) => res.json({
  status: "ok",
  service: "TuitionTrack API",
  timestamp: new Date().toISOString(),
}));
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/institute", instituteRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: error.message || "Internal server error" });
});

const startServer = async () => {
  await connectDB();
  startCronJobs();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();
