import { useEffect, useState } from "react";
import api from "../api/axios";
import Alert from "../components/Alert";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { currentMonth, formatCurrency, formatDate, getErrorMessage } from "../utils/format";

export default function Notifications() {
  const [month, setMonth] = useState(currentMonth());
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const [queueResponse, historyResponse] = await Promise.all([
        api.get("/notifications/reminder-queue", { params: { month } }),
        api.get("/notifications", { params: { month } }),
      ]);
      setQueue(queueResponse.data.reminders);
      setHistory(historyResponse.data.notifications);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => { load(); }, [month]);

  const openWhatsApp = async (reminder) => {
    try {
      setNotice("");
      setError("");
      const { data } = await api.post(`/notifications/open/${reminder.studentId}`, reminder);
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      setNotice("WhatsApp opened with a prepared message. Press Send in WhatsApp, then mark it handled.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const markHandled = async (id) => {
    try {
      await api.patch(`/notifications/${id}/handled`);
      setNotice("Reminder marked as handled");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Reminder Queue"
        subtitle="Free WhatsApp reminders: app prepares the message, teacher sends manually"
        action={<input className="input w-auto" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />}
      />

      {notice && <Alert type="success">{notice}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      <section className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Needs attention</h2>
            <p className="text-sm text-slate-500">Due soon, overdue, and partial-payment students appear here.</p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{queue.length} reminders</span>
        </div>

        <div className="mt-5 grid gap-4">
          {queue.map((reminder) => (
            <div key={`${reminder.studentId}-${reminder.type}`} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-slate-900">{reminder.studentName}</h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">Class {reminder.class}</span>
                    <StatusBadge status={reminder.type} />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {reminder.parentName} · {reminder.parentPhone} · Balance {formatCurrency(reminder.amountDue)}
                  </p>
                  <p className="mt-3 rounded-2xl bg-white p-3 text-sm leading-6 text-slate-600">{reminder.message}</p>
                </div>
                <button className="btn-primary shrink-0" onClick={() => openWhatsApp(reminder)}>
                  Open WhatsApp
                </button>
              </div>
            </div>
          ))}

          {!queue.length && (
            <EmptyState title="No reminders right now" message="When a fee is due soon, overdue, or partial, it will appear here automatically." />
          )}
        </div>
      </section>

      <section className="mt-6">
        <div className="table-wrap">
          <table className="w-full">
            <thead>
              <tr>
                <th>Student</th>
                <th>Recipient</th>
                <th>Type</th>
                <th>Opened at</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.studentId?.name || "Deleted student"}</strong>
                    <p className="text-xs text-slate-400">{item.studentId?.class ? `Class ${item.studentId.class}` : ""}</p>
                  </td>
                  <td>{item.recipientPhone || item.studentId?.parentPhone || "No phone"}</td>
                  <td className="capitalize">{String(item.type || "").replaceAll("_", " ")}</td>
                  <td>{formatDate(item.sentAt)}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>
                    {item.status === "opened" && (
                      <button className="font-semibold text-brand-700" onClick={() => markHandled(item._id)}>Mark handled</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!history.length && (
            <div className="p-5">
              <EmptyState title="No reminder history" message="Opened WhatsApp reminders will be logged here." />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
