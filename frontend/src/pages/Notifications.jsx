import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Alert from "../components/Alert";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { currentMonth, formatCurrency, formatDate, getErrorMessage } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import { DEFAULT_MESSAGE_TEMPLATE, getMessageTemplate, renderReminderMessage } from "../utils/reminders";
import { useToast } from "../context/ToastContext";

export default function Notifications() {
  const { teacher } = useAuth();
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [template, setTemplate] = useState(getMessageTemplate);
  const [pushStatus, setPushStatus] = useState(null);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    api.get("/notifications/push/status")
      .then(async ({ data }) => {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setPushStatus({
          ...data,
          subscribed: Boolean(subscription && data.subscriptionEndpoints?.includes(subscription.endpoint)),
        });
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

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
      const message = renderReminderMessage(template, reminder, teacher?.name);
      const { data } = await api.post(`/notifications/open/${reminder.studentId}`, { ...reminder, message });
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      setNotice("WhatsApp opened with a prepared message. Press Send in WhatsApp, then mark it handled.");
      toast("Reminder prepared in WhatsApp");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const preview = useMemo(() => queue[0] ? renderReminderMessage(template, queue[0], teacher?.name) : "", [queue, template, teacher?.name]);

  const saveTemplate = (value) => {
    setTemplate(value);
    localStorage.setItem("tuitiontrack_message_template", value);
  };

  const setPhoneNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setError("This browser does not support phone push notifications. Try installing TuitionTrack from Chrome or Safari.");
      return;
    }

    setPushBusy(true);
    setError("");
    try {
      if (pushStatus?.subscribed) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await api.delete("/notifications/push/subscribe", { data: { endpoint: subscription.endpoint } });
          await subscription.unsubscribe();
        }
        setPushStatus((status) => ({ ...status, subscribed: false }));
        toast("Phone notifications disabled on this device");
        return;
      }

      if (Notification.permission === "denied") {
        throw new Error("Notifications are blocked in browser settings. Allow notifications for this site, then try again.");
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Allow notifications to enable fee alerts.");
      if (!pushStatus?.publicKey) throw new Error("Phone notifications are not configured on the server yet.");

      const registration = await navigator.serviceWorker.ready;
      const applicationServerKey = Uint8Array.from(
        atob(pushStatus.publicKey.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(pushStatus.publicKey.length / 4) * 4, "=")),
        (character) => character.charCodeAt(0)
      );
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      await api.post("/notifications/push/subscribe", subscription.toJSON());
      setPushStatus((status) => ({ ...status, subscribed: true }));
      toast("Daily fee notifications enabled on this device");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPushBusy(false);
    }
  };

  const markHandled = async (id) => {
    try {
      await api.patch(`/notifications/${id}/handled`);
      setNotice("Reminder marked as handled");
      toast("Reminder marked as handled");
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

      <section className="card mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Phone push notifications</p>
          <h2 className="mt-1 font-black text-slate-900">Daily fee summary at 8:00 AM</h2>
          <p className="mt-1 text-sm text-slate-500">
            Get pending and overdue fee alerts on this device, even when TuitionTrack is closed.
            Enable once on every phone or browser you want to notify.
          </p>
        </div>
        <button
          type="button"
          className={pushStatus?.subscribed ? "btn-secondary shrink-0" : "btn-primary shrink-0"}
          onClick={setPhoneNotifications}
          disabled={pushBusy || !pushStatus?.available}
          title={!pushStatus?.available ? "Server push notifications need VAPID keys configured" : undefined}
        >
          {pushBusy ? "Please wait..." : pushStatus?.subscribed ? "Disable on this device" : "Enable on this device"}
        </button>
        {!pushStatus?.available && (
          <p className="text-xs text-amber-700 sm:max-w-48">Push setup is pending server configuration.</p>
        )}
      </section>

      <section className="card mb-6 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Message studio</p>
            <h2 className="mt-1 font-black text-slate-900">Customize parent reminders</h2>
            <p className="mt-1 text-sm text-slate-500">Use placeholders to automatically insert the child name, pending fee, month, due date, and your name.</p>
            <p className="mt-2 text-xs font-semibold text-slate-400">{'{studentName}'} · {'{parentName}'} · {'{amountDue}'} · {'{month}'} · {'{dueDate}'} · {'{teacherName}'}</p>
          </div>
          <button className="btn-secondary shrink-0" onClick={() => saveTemplate(DEFAULT_MESSAGE_TEMPLATE)}>Reset template</button>
        </div>
        <textarea className="input mt-4 min-h-28 resize-y" value={template} onChange={(event) => saveTemplate(event.target.value)} aria-label="Reminder message template" />
        {preview && (
          <div className="mt-4 rounded-2xl bg-teal-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Live preview for {queue[0].studentName}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{preview}</p>
          </div>
        )}
      </section>

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
