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

export default function Fees() {
  const [month, setMonth] = useState(currentMonth());
  const [classFilter, setClassFilter] = useState("");
  const [fees, setFees] = useState([]);
  const [amounts, setAmounts] = useState({});
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
      setAmounts(Object.fromEntries(data.fees.map((item) => [item.student._id, item.record.amountPaid])));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, classFilter]);

  const save = async (item) => {
    setError("");
    setMessage("");
    try {
      const { data } = await api.put(`/fees/${item.student._id}/${month}`, { amountPaid: Number(amounts[item.student._id] || 0) });
      setMessage("Fee saved successfully");
      load();
      if (data.record.amountPaid > 0) setReceipt({ student: data.student, record: data.record });
    } catch (err) {
      setError(getErrorMessage(err));
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
      });
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      setMessage("WhatsApp opened with a prepared reminder message. Press Send in WhatsApp.");
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
          {["9", "10", "11"].map((item) => <option key={item} value={item}>Class {item}</option>)}
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
              <tr><th>Student</th><th>Fee</th><th>Paid total</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {fees.map((item) => (
                <tr key={item.student._id}>
                  <td>
                    <strong>{item.student.name}</strong>
                    <p className="text-xs text-slate-400">Class {item.student.class} · Due day {item.student.feeDueDate}</p>
                  </td>
                  <td>{formatCurrency(item.student.feeAmount)}</td>
                  <td>
                    <input
                      className="input w-32"
                      type="number"
                      min="0"
                      max={item.student.feeAmount}
                      value={amounts[item.student._id] ?? 0}
                      onChange={(event) => setAmounts({ ...amounts, [item.student._id]: event.target.value })}
                    />
                  </td>
                  <td><StatusBadge status={item.record.status} /></td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-primary !px-3 !py-2" onClick={() => save(item)}>Save</button>
                      <button className="btn-secondary !px-3 !py-2" onClick={() => remind(item)}>WhatsApp</button>
                      {item.record.receiptNumber && <button className="font-semibold text-brand-700" onClick={() => setReceipt(item)}>Receipt</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ReceiptModal item={receipt} onClose={() => setReceipt(null)} />
    </>
  );
}
