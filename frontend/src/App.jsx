import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import LoadingState from "./components/LoadingState";
import ProtectedRoute from "./components/ProtectedRoute";

const Attendance = lazy(() => import("./pages/Attendance"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Fees = lazy(() => import("./pages/Fees"));
const Login = lazy(() => import("./pages/Login"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Receipts = lazy(() => import("./pages/Receipts"));
const Students = lazy(() => import("./pages/Students"));
const Team = lazy(() => import("./pages/Team"));

export default function App() {
  return (
    <Suspense fallback={<LoadingState label="Opening TuitionTrack" />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="fees" element={<Fees />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="receipts" element={<Receipts />} />
          <Route path="team" element={<Team />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
