import { useEffect, useState } from "react";
import api from "../api/axios";
import Alert from "../components/Alert";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import ReceiptModal from "../components/ReceiptModal";
import StatusBadge from "../components/StatusBadge";
import { currentMonth, formatCurrency, formatDate, getErrorMessage } from "../utils/format";

const getLegacyTransactions = (fees) => fees.flatMap(({ student, record }) => {
  if (!student || Number(record?.amountPaid || 0) <= 0) return [];
  return [{
    student,
    record: {
      ...record,
      amountPaid: Number(record.amountPaid),
      paidOn: record.paidOn || record.updatedAt || record.createdAt || null,
      receiptNumber: record.receiptNumber || `TT-LEGACY-${String(record._id || student._id).slice(-8).toUpperCase()}`,
      method: "other",
      isLegacy: true,
      note: "This receipt reflects the monthly total on the older fee service.",
    },
  }];
});

export default function Receipts() {
  const [month, setMonth] = useState(currentMonth());
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    const loadTransactions = async () => {
      try {
        const { data } = await api.get("/fees/transactions", { params: { month } });
        if (active) setItems(data.transactions || []);
      } catch (err) {
        if (err.response?.status !== 404 || err.response?.data?.message !== "Route not found") throw err;
        const { data } = await api.get("/fees", { params: { month } });
        if (active) setItems(getLegacyTransactions(data.fees || []));
      }
    };

    loadTransactions()
      .catch((err) => { if (active) setError(getErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month]);

  return (
    <>
      <PageHeader
        title="Receipts"
        subtitle="View and download fee payment receipts"
        action={<input className="input w-auto" type="month" value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Receipt month" />}
      />
      {error && <Alert type="error">{error}</Alert>}
      {loading ? <LoadingState label="Loading receipts" /> : items.length ? (
        <div className="table-wrap">
          <table className="w-full">
            <thead><tr><th>Receipt</th><th>Student</th><th>Paid</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.record._id || item.record.receiptNumber}>
                  <td className="font-mono text-xs">{item.record.receiptNumber}</td>
                  <td>
                    <strong>{item.student.name}</strong>
                    <p className="text-xs text-slate-400">Class {item.student.class}{item.student.isArchived ? " · Archived" : ""}</p>
                  </td>
                  <td>{formatCurrency(item.record.amountPaid ?? item.record.amount)}</td>
                  <td>{formatDate(item.record.paidOn || item.record.paidAt)}</td>
                  <td><StatusBadge status={item.record.status || item.record.statusAfterPayment} /></td>
                  <td><button type="button" className="font-semibold text-brand-700" onClick={() => setSelected(item)}>Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <EmptyState title="No receipts this month" message="Recorded fee payments will appear here. Try a different month if needed." />
        </div>
      )}
      <ReceiptModal item={selected} onClose={() => setSelected(null)} />
    </>
  );
}
