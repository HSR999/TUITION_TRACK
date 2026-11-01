import { useEffect, useState } from "react";
import api from "../api/axios";
import Alert from "../components/Alert";
import EmptyState from "../components/EmptyState";
import FeeCalendar from "../components/FeeCalendar";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import ReceiptModal from "../components/ReceiptModal";
import StatusBadge from "../components/StatusBadge";
import { currentMonth, formatCurrency, getErrorMessage } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import { getMessageTemplate, renderReminderMessage } from "../utils/reminders";
import { getClassOptions } from "../utils/classes";
import { useToast } from "../context/ToastContext";

export default function Fees() {
  const { teacher } = useAuth();
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [classFilter, setClassFilter] = useState("");
  const [fees, setFees] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("other");
  const [savingStudentId, setSavingStudentId] = useState(null);
  const [view, setView] = useState("list");
  const [receipt, setReceipt] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/fees", { params: { month, class: classFilter || undefined } });
      setFees(data.fees);
      setPaymentAmounts(Object.fromEntries(data.fees.map((item) => [item.student._id, ""])));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, classFilter]);
  useEffect(() => {
    api.get("/students")
      .then(({ data }) => setClassOptions(getClassOptions(data.students)))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const save = async (item) => {
    if (savingStudentId) return;
    setError("");
    setMessage("");
    setSavingStudentId(item.student._id);
    try {
      const amount = Number(paymentAmounts[item.student._id]);
      let data;
      try {
        ({ data } = await api.post(`/fees/${item.student._id}/${month}/payments`, {
          amount,
          method: paymentMethod,
        }));
      } catch (err) {
        if (err.response?.status !== 404 || err.response?.data?.message !== "Route not found") throw err;
        ({ data } = await api.put(`/fees/${item.student._id}/${month}`, {
          amountPaid: Number(item.record.amountPaid || 0) + amount,
        }));
      }
      setMessage("Payment recorded successfully");
      toast("Payment recorded successfully");
      await load();
      const record = data.payment || (data.record && {
        ...data.record,
        amountPaid: data.payment?.amountPaid ?? data.record.amountPaid,
        paidOn: data.payment?.paidOn || data.record.paidOn,
        status: data.payment?.status || data.record.status,
        isLegacy: !data.payment,
        note: data.payment ? "" : "This receipt reflects the monthly total on the older fee service.",
      });
      if (record) setReceipt({ student: data.student || item.student, record });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingStudentId(null);
    }
  };

  const remind = async (item) => {
    setError("");
    setMessage("");
    try {
      const amountDue = Math.max(item.student.feeAmount - Number(item.record.amountPaid || 0), 0);
      const { data } = await api.post(`/notifications/send/${item.student._id}`, {
        month,
        amountDue,
        type: item.record.status === "partial" ? "partial" : "manual",
        message: renderReminderMessage(getMessageTemplate(), {
          parentName: item.student.parentName,
          studentName: item.student.name,
          month,
          amountDue,
          dueDate: item.student.feeDueDate,
        }, teacher?.name),
      });
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      setMessage("WhatsApp opened with a prepared reminder message. Press Send in WhatsApp.");
      toast("Reminder prepared in WhatsApp");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader title="Fees" subtitle="Track monthly payments, WhatsApp reminders and receipts" />
      {message && <Alert type="success">{message}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      <div className="mb-5 flex flex-wrap gap-3">
        <input className="input w-auto" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        <select className="input w-auto" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
          <option value="">All classes</option>
          {classOptions.map((item) => <option key={item} value={item}>Class {item}</option>)}
        </select>
        <select className="input w-auto" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} aria-label="Payment method">
          <option value="other">Payment method</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="bank_transfer">Bank transfer</option>
        </select>
        <button className="btn-secondary" onClick={() => setView(view === "list" ? "calendar" : "list")}>
          {view === "list" ? "Calendar view" : "List view"}
        </button>
      </div>

      {loading ? (
        <LoadingState label="Loading fees" />
      ) : view === "calendar" ? (
        <FeeCalendar month={month} fees={fees} />
      ) : fees.length === 0 ? (
        <EmptyState title="No fee records yet" message="Add students first. Fee rows are generated month-wise from student fee amounts." />
      ) : (
        <div className="table-wrap">
          <table className="w-full">
            <thead>
              <tr><th>Student</th><th>Fee</th><th>Paid total</th><th>New payment</th><th>Status</th><th>History</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {fees.map((item) => {
                const payments = Array.isArray(item.payments)
                  ? item.payments
                  : item.record?.amountPaid > 0 ? [item.record] : [];
                return (
                <tr key={item.student._id}>
                  <td>
                    <strong>{item.student.name}</strong>
                    <p className="text-xs text-slate-400">Class {item.student.class} · Due day {item.student.feeDueDate}</p>
                  </td>
                  <td>{formatCurrency(item.student.feeAmount)}</td>
                  <td>{formatCurrency(item.record.amountPaid || 0)}</td>
                  <td>
                    <input
                      className="input w-32"
                      type="number"
                      min="0.01"
                      max={Math.max(item.student.feeAmount - Number(item.record.amountPaid || 0), 0)}
                      step="0.01"
                      value={paymentAmounts[item.student._id] ?? ""}
                      onChange={(event) => setPaymentAmounts({ ...paymentAmounts, [item.student._id]: event.target.value })}
                      aria-label={`New payment for ${item.student.name}`}
                    />
                  </td>
                  <td><StatusBadge status={item.record.status} /></td>
                  <td>{payments.length} payment{payments.length === 1 ? "" : "s"}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-primary !px-3 !py-2" onClick={() => save(item)} disabled={savingStudentId !== null || !paymentAmounts[item.student._id] || Number(paymentAmounts[item.student._id]) <= 0 || Number(paymentAmounts[item.student._id]) > item.student.feeAmount - Number(item.record.amountPaid || 0)}>{savingStudentId === item.student._id ? "Recording..." : "Record"}</button>
                      <button className="btn-secondary !px-3 !py-2" onClick={() => remind(item)}>WhatsApp</button>
                      {payments[0] && <button className="font-semibold text-brand-700" onClick={() => setReceipt({ student: item.student, record: payments[0] })}>Latest receipt</button>}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ReceiptModal item={receipt} onClose={() => setReceipt(null)} />
    </>
  );
}
