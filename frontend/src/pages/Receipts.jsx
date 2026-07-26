import { useEffect, useState } from "react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import ReceiptModal from "../components/ReceiptModal";
import StatusBadge from "../components/StatusBadge";
import { currentMonth, formatCurrency, formatDate, getErrorMessage } from "../utils/format";

export default function Receipts() {
  const [month, setMonth] = useState(currentMonth()); const [items, setItems] = useState([]); const [selected, setSelected] = useState(null); const [error, setError] = useState("");
  useEffect(() => { api.get("/fees", { params: { month } }).then(({ data }) => setItems(data.fees.filter((item) => item.record.receiptNumber))).catch((err) => setError(getErrorMessage(err))); }, [month]);
  return <><PageHeader title="Receipts" subtitle="Download payment receipts as PDF" action={<input className="input w-auto" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />} />{error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}<div className="table-wrap"><table className="w-full"><thead><tr><th>Receipt</th><th>Student</th><th>Paid</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>{items.map((item) => <tr key={item.record._id}><td className="font-mono text-xs">{item.record.receiptNumber}</td><td><strong>{item.student.name}</strong><p className="text-xs text-slate-400">Class {item.student.class}</p></td><td>{formatCurrency(item.record.amountPaid)}</td><td>{formatDate(item.record.paidOn)}</td><td><StatusBadge status={item.record.status} /></td><td><button className="font-semibold text-brand-700" onClick={() => setSelected(item)}>Open</button></td></tr>)}</tbody></table>{!items.length && <p className="p-8 text-center text-sm text-slate-500">No receipts for this month.</p>}</div><ReceiptModal item={selected} onClose={() => setSelected(null)} /></>;
}
