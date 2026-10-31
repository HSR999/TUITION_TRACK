import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/axios";
import Alert from "../components/Alert";
import AppIcon from "../components/AppIcon";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatDate, getErrorMessage, today } from "../utils/format";

const monthDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function Dashboard() {
  const { teacher, logout } = useAuth();
  const [data, setData] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState("");
  const [reminderError, setReminderError] = useState("");
  const [selectedDay, setSelectedDay] = useState(Number(today().slice(-2)));
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    api.get("/dashboard")
      .then(async (response) => {
        setData(response.data);
        try {
          const reminderResponse = await api.get("/notifications/reminder-queue", { params: { month: response.data.month } });
          setReminders(reminderResponse.data.reminders);
        } catch (err) {
          setReminderError(getErrorMessage(err));
        }
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!data) return <LoadingState label="Loading dashboard" />;

  const { stats, feeCollection, revenueChart } = data;
  const [year, monthNumber] = data.month.split("-").map(Number);
  const monthDate = new Date(year, monthNumber - 1);
  const monthLabel = monthDate.toLocaleString("en-IN", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const firstDay = (new Date(year, monthNumber - 1, 1).getDay() + 6) % 7;
  const calendarDays = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  const dueDays = data.dueDays || [];
  const nextFee = reminders.find((reminder) => reminder.daysUntilDue >= 0) || reminders[0];
  const tickerReminders = reminders.length > 3 ? [...reminders, ...reminders] : reminders;
  const studentsWithBalance = feeCollection.due + feeCollection.partial;
  const metrics = [
    {
      label: "Collected this month",
      value: formatCurrency(stats.monthlyRevenue),
      detail: monthLabel,
      icon: "revenue",
      tone: "revenue",
    },
    {
      label: "Outstanding balance",
      value: formatCurrency(stats.pendingFees),
      detail: `${studentsWithBalance} ${studentsWithBalance === 1 ? "student" : "students"} with a balance`,
      icon: "fees",
      tone: "outstanding",
    },
    {
      label: "Active students",
      value: stats.totalStudents,
      detail: "Currently enrolled",
      icon: "students",
      tone: "students",
    },
  ];

  return (
    <div className="reference-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Tuition dashboard</h1>
          <p className="dashboard-subtitle">Fee collection, upcoming dues and student follow-ups.</p>
        </div>
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
      </header>

      <section className="dashboard-metrics" aria-label="Tuition overview">
        {metrics.map((metric) => (
          <article className={`dashboard-metric dashboard-metric--${metric.tone}`} key={metric.label}>
            <div className="dashboard-metric-copy">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.detail}</small>
            </div>
            <div className="dashboard-metric-art" aria-hidden="true">
              <AppIcon name={metric.icon} className="h-full w-full" />
            </div>
          </article>
        ))}
      </section>

      <div className="dashboard-panels">
        <section className="dashboard-panel dashboard-reminders">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Fee reminders to send</h2>
              <p>{reminders.length ? `${reminders.length} students need a fee follow-up` : "Upcoming and overdue fee follow-ups"}</p>
            </div>
            <div className="dashboard-reminder-actions">
              <Link to="/notifications/compose" className="reference-link">Custom message <span aria-hidden="true">↗</span></Link>
              <Link to="/notifications" className="reference-link">View queue <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          {reminderError ? (
            <p className="dashboard-reminder-empty">{reminderError}</p>
          ) : nextFee ? (
            <>
              <div className="dashboard-next-fee">
                <span>{nextFee.daysUntilDue >= 0 ? "Next fee due" : "Next follow-up"}</span>
                <strong>{nextFee.studentName}</strong>
                <span>{formatDate(nextFee.dueDate)} · {formatCurrency(nextFee.amountDue)}</span>
                <Link to={`/notifications/compose?studentId=${nextFee.studentId}&month=${data.month}`} aria-label={`Prepare WhatsApp reminder for ${nextFee.studentName}`}>
                  <AppIcon name="reminder" className="h-5 w-5" />
                  <span>Prepare reminder</span>
                </Link>
              </div>
              <div className="dashboard-reminder-ticker" aria-label="Students with pending fee reminders">
                <div className={`dashboard-reminder-track${reminders.length > 3 ? " is-scrolling" : ""}`}>
                  {tickerReminders.map((reminder, index) => (
                    <Link
                      key={`${reminder.studentId}-${index}`}
                      to={`/notifications/compose?studentId=${reminder.studentId}&month=${data.month}`}
                      className="dashboard-reminder-row"
                      aria-hidden={index >= reminders.length ? "true" : undefined}
                      tabIndex={index >= reminders.length ? -1 : undefined}
                    >
                      <span className={`dashboard-reminder-status dashboard-reminder-status--${reminder.type}`}>
                        {reminder.type === "overdue" ? "Overdue" : reminder.type === "partial" ? "Part paid" : "Due soon"}
                      </span>
                      <strong>{reminder.studentName}</strong>
                      <span>Class {reminder.class}</span>
                      <span>{formatDate(reminder.dueDate)}</span>
                      <strong>{formatCurrency(reminder.amountDue)}</strong>
                      <span className="dashboard-reminder-cta">Prepare WhatsApp</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="dashboard-reminder-empty">No fee reminders are due right now.</p>
          )}
        </section>

        <section className="dashboard-panel dashboard-revenue">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Revenue</h2>
              <p>Fee payments collected over the last six months</p>
            </div>
            <Link to="/fees" className="reference-link">View fees <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e8eee9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#82908a" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => value === 0 ? "₹0" : `₹${Math.round(value / 1000)}k`} tick={{ fontSize: 10, fill: "#82908a" }} axisLine={false} tickLine={false} width={44} />
                <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: "rgba(130, 212, 103, 0.1)" }} />
                <Bar dataKey="revenue" name="Collected" fill="#8bd66f" radius={[8, 8, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="dashboard-panel dashboard-due">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Fee due dates</h2>
              <p>{monthLabel}</p>
            </div>
            <span className="dashboard-due-count">{dueDays.length} dates</span>
          </div>
          <div className="calendar-week">{monthDays.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-days">
            {calendarDays.map((day, index) => (
              <button
                type="button"
                key={`${day}-${index}`}
                disabled={!day}
                onClick={() => day && setSelectedDay(day)}
                aria-label={day ? `${monthLabel} ${day}${dueDays.includes(day) ? ", fees due" : ""}` : undefined}
                className={day === selectedDay ? "selected" : day && dueDays.includes(day) ? "due-day" : !day ? "muted" : ""}
              >
                {day || ""}
              </button>
            ))}
          </div>
          <p className="calendar-insight">
            {dueDays.includes(selectedDay)
              ? `Fee follow-up due on ${selectedDay} ${monthDate.toLocaleString("en-IN", { month: "short" })}.`
              : `No fee due recorded on ${selectedDay} ${monthDate.toLocaleString("en-IN", { month: "short" })}.`}
          </p>
        </section>
      </div>
    </div>
  );
}
