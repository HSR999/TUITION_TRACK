import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import Alert from "../components/Alert";
import AppIcon from "../components/AppIcon";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { currentMonth, formatCurrency, formatDate, getErrorMessage } from "../utils/format";
import { DEFAULT_MESSAGE_TEMPLATE, getMessageTemplate, renderReminderMessage } from "../utils/reminders";

const getStudentId = (student) => typeof student === "string" ? student : student?._id;

export default function Notifications() {
  const { pathname } = useLocation();

  if (pathname.endsWith("/compose")) return <ReminderComposer />;
  if (pathname.endsWith("/history")) return <ReminderHistory />;
  if (pathname.endsWith("/settings")) return <ReminderSettings />;
  return <ReminderQueue />;
}

function ReminderNavigation() {
  return (
    <nav className="reminder-action-grid" aria-label="Reminder tasks">
      <Link to="/notifications/compose" className="reminder-action-card">
        <AppIcon name="reminder" className="h-7 w-7" />
        <span><strong>Custom message</strong><small>Choose a student and edit the WhatsApp message.</small></span>
        <span className="reminder-action-arrow" aria-hidden="true">↗</span>
      </Link>
      <Link to="/notifications/history" className="reminder-action-card">
        <AppIcon name="receipts" className="h-7 w-7" />
        <span><strong>Message history</strong><small>Review prepared reminders and handled follow-ups.</small></span>
        <span className="reminder-action-arrow" aria-hidden="true">↗</span>
      </Link>
      <Link to="/notifications/settings" className="reminder-action-card">
        <AppIcon name="notifications" className="h-7 w-7" />
        <span><strong>Phone alerts</strong><small>Manage daily fee notifications on this device.</small></span>
        <span className="reminder-action-arrow" aria-hidden="true">↗</span>
      </Link>
    </nav>
  );
}

function ReminderQueue() {
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      api.get("/notifications/reminder-queue", { params: { month } }),
      api.get("/notifications", { params: { month } }),
    ])
      .then(([queueResponse, historyResponse]) => {
        if (!active) return;
        setQueue(queueResponse.data.reminders);
        setHistory(historyResponse.data.notifications);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [month]);

  const openedByStudent = useMemo(() => {
    const opened = new Map();
    history.forEach((item) => {
      const studentId = getStudentId(item.studentId);
      if (item.status === "opened" && studentId && !opened.has(studentId)) opened.set(studentId, item);
    });
    return opened;
  }, [history]);

  const markHandled = async (item) => {
    try {
      await api.patch(`/notifications/${item._id}/handled`);
      const studentId = getStudentId(item.studentId);
      setQueue((current) => current.filter((reminder) => reminder.studentId !== studentId));
      setHistory((current) => current.map((log) => log._id === item._id ? { ...log, status: "handled" } : log));
      setNotice("Follow-up marked handled and removed from the pending list.");
      toast("Follow-up marked handled");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Fee follow-ups"
        subtitle="Prepare WhatsApp reminders for upcoming, overdue and partial fee balances."
        action={<input className="input w-auto" type="month" value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Reminder month" />}
      />
      {notice && <Alert type="success">{notice}</Alert>}
      {error && <Alert type="error">{error}</Alert>}
      <ReminderNavigation />

      <section className="card mt-5 p-5">
        <div className="reminder-section-heading">
          <div>
            <h2>Needs a follow-up</h2>
            <p>Open a prepared message, send it in WhatsApp, then mark the follow-up handled.</p>
          </div>
          <span className="reminder-count">{queue.length} pending</span>
        </div>

        {loading ? <LoadingState label="Loading fee follow-ups" /> : (
          <div className="reminder-queue-list">
            {queue.map((reminder) => {
              const openedLog = openedByStudent.get(reminder.studentId);
              return (
                <article className="reminder-queue-item" key={reminder.studentId}>
                  <div className="reminder-student">
                    <strong>{reminder.studentName}</strong>
                    <span>Class {reminder.class} · {reminder.parentName}</span>
                    <small>{reminder.parentPhone}</small>
                  </div>
                  <div className="reminder-balance">
                    <span>Balance due</span>
                    <strong>{formatCurrency(reminder.amountDue)}</strong>
                  </div>
                  <div className="reminder-due-date">
                    <StatusBadge status={reminder.type} />
                    <span>Due {formatDate(reminder.dueDate)}</span>
                  </div>
                  <div className="reminder-row-actions">
                    <Link
                      className="btn-primary reminder-prepare-button"
                      to={`/notifications/compose?studentId=${reminder.studentId}&month=${month}`}
                    >
                      {openedLog ? "Edit / reopen" : "Prepare message"}
                    </Link>
                    {openedLog && (
                      <button type="button" className="reminder-handled-button" onClick={() => markHandled(openedLog)}>
                        Mark handled
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            {!queue.length && !error && (
              <EmptyState title="All caught up" message="Students with an upcoming, overdue or partial fee balance will appear here." />
            )}
          </div>
        )}
      </section>
    </>
  );
}

function ReminderComposer() {
  const { teacher } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [month, setMonth] = useState(searchParams.get("month") || currentMonth());
  const [feeRows, setFeeRows] = useState([]);
  const [studentId, setStudentId] = useState(searchParams.get("studentId") || "");
  const [template, setTemplate] = useState(getMessageTemplate);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [openedNotification, setOpenedNotification] = useState(null);
  const [blockedWhatsAppUrl, setBlockedWhatsAppUrl] = useState("");

  useEffect(() => {
    const requestedStudentId = searchParams.get("studentId");
    const requestedMonth = searchParams.get("month");
    if (requestedStudentId) setStudentId(requestedStudentId);
    if (requestedMonth) setMonth(requestedMonth);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setOpenedNotification(null);
    api.get("/fees", { params: { month } })
      .then(({ data }) => {
        if (!active) return;
        const owingRows = data.fees.filter(({ student, record }) => (
          Number(student.feeAmount) > Number(record.amountPaid || 0) && Boolean(student.parentPhone)
        ));
        setFeeRows(owingRows);
        setStudentId((current) => (
          owingRows.some(({ student }) => student._id === current)
            ? current
            : owingRows[0]?.student._id || ""
        ));
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [month]);

  const selectedFee = feeRows.find(({ student }) => student._id === studentId);
  const reminder = useMemo(() => {
    if (!selectedFee) return null;
    const { student, record } = selectedFee;
    const [year, monthNumber] = month.split("-").map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();
    const dueDay = Math.min(Number(student.feeDueDate), lastDay);
    const dueDate = new Date(Date.UTC(year, monthNumber - 1, dueDay, 12));
    const amountDue = Math.max(Number(student.feeAmount) - Number(record.amountPaid || 0), 0);
    return {
      studentId: student._id,
      studentName: student.name,
      class: student.class,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      month,
      amountDue,
      dueDate,
      type: record.status === "partial" ? "partial" : "manual",
    };
  }, [selectedFee, month]);
  const preview = reminder ? renderReminderMessage(template, reminder, teacher?.name) : "";

  const openWhatsApp = async (event) => {
    event.preventDefault();
    if (!reminder || sending) return;
    const whatsappWindow = window.open("about:blank", "_blank");
    setSending(true);
    setError("");
    setBlockedWhatsAppUrl("");
    try {
      const { data } = await api.post(`/notifications/open/${reminder.studentId}`, {
        ...reminder,
        message: preview,
      });
      setOpenedNotification(data.notification);
      if (whatsappWindow) whatsappWindow.location.href = data.whatsappUrl;
      else setBlockedWhatsAppUrl(data.whatsappUrl);
      toast("WhatsApp reminder is ready");
    } catch (err) {
      whatsappWindow?.close();
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const markHandled = async () => {
    if (!openedNotification) return;
    try {
      await api.patch(`/notifications/${openedNotification._id}/handled`);
      toast("Follow-up marked handled");
      navigate("/notifications", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const saveTemplate = () => {
    localStorage.setItem("tuitiontrack_message_template", template);
    toast("Saved as your default reminder");
  };

  return (
    <>
      <PageHeader title="Prepare a WhatsApp reminder" subtitle="Choose a student, review the message, then send it from WhatsApp." />
      <div className="reminder-stepper" aria-label="Reminder steps">
        <span className="is-current"><b>1</b> Choose student</span>
        <span className="is-current"><b>2</b> Review message</span>
        <span className={openedNotification ? "is-current" : ""}><b>3</b> Confirm handled</span>
      </div>
      {error && <Alert type="error">{error}</Alert>}
      {loading ? <LoadingState label="Loading students with a balance" /> : !feeRows.length ? (
        <section className="card mt-5"><EmptyState title="No balances to remind" message="There are no students with an unpaid balance and a parent phone number for this month." /><Link className="btn-secondary mt-4 inline-flex" to="/notifications">Back to follow-ups</Link></section>
      ) : (
        <form className="reminder-compose-layout" onSubmit={openWhatsApp}>
          <section className="card reminder-compose-card">
            <div className="reminder-compose-topline">
              <span className="reminder-step-number">1</span>
              <div><h2>Choose student</h2><p>Select who should receive this message.</p></div>
              <input className="input reminder-month-input" type="month" value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Fee month" />
            </div>
            <label className="reminder-field">
              <span>Student with balance</span>
              <select className="input" value={studentId} onChange={(event) => { setStudentId(event.target.value); setOpenedNotification(null); }}>
                {feeRows.map(({ student, record }) => (
                  <option value={student._id} key={student._id}>
                    {student.name} · Class {student.class} · {formatCurrency(Math.max(student.feeAmount - Number(record.amountPaid || 0), 0))}
                  </option>
                ))}
              </select>
            </label>
            {reminder && <p className="reminder-recipient">To {reminder.parentName} · {reminder.parentPhone}</p>}
          </section>

          <section className="card reminder-compose-card">
            <div className="reminder-compose-topline">
              <span className="reminder-step-number">2</span>
              <div><h2>Review and edit</h2><p>Personalize this message before opening WhatsApp.</p></div>
              <button type="button" className="reminder-text-button" onClick={saveTemplate}>Save as default</button>
            </div>
            <label className="reminder-field">
              <span>WhatsApp message</span>
              <textarea className="input reminder-message-input" value={template} onChange={(event) => setTemplate(event.target.value)} required />
            </label>
            {preview && <div className="reminder-live-preview"><span>Preview</span><p>{preview}</p></div>}
            <p className="reminder-placeholder-help">Available fields: {"{studentName}"}, {"{parentName}"}, {"{amountDue}"}, {"{month}"}, {"{dueDate}"}, {"{teacherName}"}.</p>
          </section>

          {openedNotification ? (
            <section className="reminder-confirmation">
              <span className="reminder-step-number">3</span>
              <div>
                <strong>WhatsApp is open with your message.</strong>
                <p>Send it in WhatsApp, then return here to clear this follow-up from the pending list.</p>
                {blockedWhatsAppUrl && <a className="reminder-whatsapp-fallback" href={blockedWhatsAppUrl} target="_blank" rel="noreferrer">Open WhatsApp message</a>}
              </div>
              <button type="button" className="btn-primary" onClick={markHandled}>I sent it — mark handled</button>
            </section>
          ) : (
            <div className="reminder-compose-actions">
              <Link to="/notifications" className="btn-secondary">Back to follow-ups</Link>
              <button type="submit" className="btn-primary" disabled={sending || !reminder}>
                {sending ? "Preparing..." : "Open WhatsApp"}
              </button>
            </div>
          )}
        </form>
      )}
    </>
  );
}

function ReminderHistory() {
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/notifications", { params: { month } })
      .then(({ data }) => { if (active) setHistory(data.notifications); })
      .catch((err) => { if (active) setError(getErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month]);

  const markHandled = async (id) => {
    try {
      await api.patch(`/notifications/${id}/handled`);
      setHistory((current) => current.map((item) => item._id === id ? { ...item, status: "handled" } : item));
      toast("Follow-up marked handled");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader title="Message history" subtitle="Review prepared WhatsApp reminders and follow-ups you have handled." action={<input className="input w-auto" type="month" value={month} onChange={(event) => setMonth(event.target.value)} aria-label="History month" />} />
      {error && <Alert type="error">{error}</Alert>}
      <ReminderNavigation />
      <section className="card mt-5 p-5">
        {loading ? <LoadingState label="Loading reminder history" /> : !history.length ? (
          <EmptyState title="No messages this month" message="Prepared WhatsApp reminders will appear here." />
        ) : (
          <div className="table-wrap">
            <table className="w-full">
              <thead><tr><th>Student</th><th>Recipient</th><th>Reminder</th><th>Prepared</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item._id}>
                    <td><strong>{item.studentId?.name || "Deleted student"}</strong><p className="text-xs text-slate-400">{item.studentId?.class ? `Class ${item.studentId.class}` : ""}</p></td>
                    <td>{item.recipientPhone || item.studentId?.parentPhone || "No phone"}</td>
                    <td className="capitalize">{String(item.type || "").replaceAll("_", " ")}</td>
                    <td>{formatDate(item.sentAt)}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>{item.status === "opened" && <button type="button" className="reminder-handled-button" onClick={() => markHandled(item._id)}>Mark handled</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function ReminderSettings() {
  const [pushStatus, setPushStatus] = useState(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    api.get("/notifications/push/status")
      .then(async ({ data }) => {
        let subscription = null;
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const registration = await navigator.serviceWorker.ready;
          subscription = await registration.pushManager.getSubscription();
        }
        setPushStatus({
          ...data,
          subscribed: Boolean(subscription && data.subscriptionEndpoints?.includes(subscription.endpoint)),
        });
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const setPhoneNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setError("This browser does not support phone notifications. Try installing TuitionTrack from Chrome or Safari.");
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
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      await api.post("/notifications/push/subscribe", subscription.toJSON());
      setPushStatus((status) => ({ ...status, subscribed: true }));
      toast("Daily fee notifications enabled on this device");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Phone alert settings" subtitle="Choose whether this device receives a daily fee summary." />
      {error && <Alert type="error">{error}</Alert>}
      <ReminderNavigation />
      <section className="card reminder-settings-card mt-5">
        <div className="reminder-settings-icon"><AppIcon name="notifications" className="h-7 w-7" /></div>
        <div>
          <h2>Daily fee summary</h2>
          <p>Receive pending and overdue fee alerts at 8:00 AM, even when TuitionTrack is closed. Enable this separately on each device.</p>
          {!pushStatus?.available && <small>Phone notifications are not configured on the server yet.</small>}
        </div>
        <button type="button" className={pushStatus?.subscribed ? "btn-secondary" : "btn-primary"} onClick={setPhoneNotifications} disabled={pushBusy || !pushStatus?.available}>
          {pushBusy ? "Please wait..." : pushStatus?.subscribed ? "Disable on this device" : "Enable on this device"}
        </button>
      </section>
    </>
  );
}
