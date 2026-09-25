import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/axios";
import Alert from "../components/Alert";
import AppIcon from "../components/AppIcon";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, getErrorMessage } from "../utils/format";

const monthDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function Dashboard() {
  const { teacher, logout } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    api.get("/dashboard")
      .then((response) => setData(response.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!data) return <LoadingState label="Loading dashboard" />;

  const { stats, feeCollection, revenueChart } = data;
  const [year, monthNumber] = data.month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const firstDay = (new Date(year, monthNumber - 1, 1).getDay() + 6) % 7;
  const calendarDays = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  const dueDays = data.dueDays || [];

  return (
    <div className="reference-dashboard">
      <header className="reference-header">
        <div>
          <p className="reference-kicker">TuitionTrack workspace</p>
          <h1>Welcome back <span aria-hidden="true">👋</span></h1>
        </div>
        <div className="reference-header-actions">
          <div className="profile-menu">
            <button type="button" className="reference-avatar" onClick={() => setProfileOpen((open) => !open)} aria-label="Open profile">
              {teacher?.name?.slice(0, 1) || "T"}
            </button>
            {profileOpen && (
              <div className="profile-popover">
                <strong>{teacher?.name || "Teacher"}</strong>
                <span>{teacher?.email}</span>
                <button type="button" onClick={logout}>Log out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="reference-grid">
        <section className="reference-main-column">
          <div className="reference-section-heading">
            <h2>Your activities today</h2>
            <span>({data.month})</span>
          </div>
          <div className="activity-grid">
            <ActivityCard to="/students" tone="mint" icon="students" title="Student directory" detail={`${stats.totalStudents} active students`} />
            <ActivityCard to="/fees" tone="pink" icon="fees" title="Fee collection" detail={`${feeCollection.due} payments need attention`} />
          </div>

          <div className="reference-section-heading progress-heading">
            <h2>Tuition health</h2>
          </div>
          <div className="progress-grid">
            <ProgressCard tone="mint" label="Paid fees" value={feeCollection.paid} detail="students cleared" to="/fees" />
            <ProgressCard tone="yellow" label="Due fees" value={feeCollection.due} detail={formatCurrency(stats.pendingFees)} to="/notifications" />
            <ProgressCard tone="lavender" label="Students" value={stats.totalStudents} detail={`${stats.avgAttendance}% attendance`} to="/students" />
          </div>

          <Link to="/fees" className="course-card tone-yellow">
            <div className="course-card-top"><span className="course-icon"><AppIcon name="fees" className="h-4 w-4" /></span><strong>Fee follow-up</strong><span className="circle-arrow">↗</span></div>
            <p>{feeCollection.due} students have outstanding balances totalling {formatCurrency(stats.pendingFees)}</p>
            <div className="progress-track"><span style={{ width: `${Math.max(12, Math.round((feeCollection.paid / Math.max(stats.totalStudents, 1)) * 100))}%` }} /></div>
          </Link>

          <section className="reference-report card">
            <div className="reference-report-heading">
              <div><h2>Revenue trend</h2><p>Six month collection overview</p></div>
              <Link to="/fees" className="reference-link">View fees ↗</Link>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#b9dcdc" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </section>

        <aside className="reference-side-column">
          <div className="reference-section-heading"><h2>Lesson schedule</h2></div>
          <div className="calendar-card">
            <div className="calendar-title"><strong>{new Date(year, monthNumber - 1).toLocaleString("en-IN", { month: "long", year: "numeric" })}</strong><span>{dueDays.length} due</span></div>
            <div className="calendar-week">{monthDays.map((day) => <span key={day}>{day}</span>)}</div>
            <div className="calendar-days">{calendarDays.map((day, index) => <button type="button" key={`${day}-${index}`} onClick={() => day && setSelectedDay(day)} className={day === selectedDay ? "selected" : day && dueDays.includes(day) ? "soft due-day" : !day ? "muted" : ""}>{day || ""}</button>)}</div>
            <p className="calendar-insight">{dueDays.includes(selectedDay) ? `Fee follow-up due on ${selectedDay} ${new Date(year, monthNumber - 1).toLocaleString("en-IN", { month: "short" })}.` : `No fee due recorded on ${selectedDay} ${new Date(year, monthNumber - 1).toLocaleString("en-IN", { month: "short" })}.`}</p>
          </div>

          <Link to="/notifications" className="schedule-card tone-mint"><span className="schedule-icon"><AppIcon name="reminder" /></span><span>Follow up outstanding fee reminders</span><b>↗</b></Link>
          <Link to="/attendance" className="schedule-card tone-lavender"><span className="schedule-icon"><AppIcon name="attendance" /></span><span>Review this month&apos;s attendance</span><b>↗</b></Link>
          <Link to="/expenses" className="schedule-card tone-pink"><span className="schedule-icon"><AppIcon name="expenses" /></span><span>Check coaching expenses</span><b>↗</b></Link>

          <div className="reference-account card">
            <AppIcon name="teacher" className="h-10 w-10" />
            <div><strong>{teacher?.name || "Teacher"}</strong><span>{teacher?.email || "Teaching workspace"}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ActivityCard({ to, tone, icon, title, detail }) {
  return <Link to={to} className={`activity-card tone-${tone}`}><div className="activity-avatars"><AppIcon name={icon} className="h-8 w-8" /><span>+6</span></div><strong>{title}</strong><small>{detail}</small><span className="circle-arrow">↗</span></Link>;
}

function ProgressCard({ to, tone, label, value, detail }) {
  return <Link to={to} className={`progress-card tone-${tone}`}><small>{label}</small><strong>{value}</strong><span>{detail}</span><span className="circle-arrow">↗</span></Link>;
}
