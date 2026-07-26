export default function StatusBadge({ status }) {
  const styles = {
    paid: "bg-emerald-100 text-emerald-700",
    partial: "bg-amber-100 text-amber-700",
    due: "bg-red-100 text-red-700",
    present: "bg-emerald-100 text-emerald-700",
    absent: "bg-red-100 text-red-700",
    sent: "bg-blue-100 text-blue-700",
    failed: "bg-red-100 text-red-700",
    opened: "bg-blue-100 text-blue-700",
    handled: "bg-emerald-100 text-emerald-700",
    upcoming_due: "bg-amber-100 text-amber-700",
    overdue: "bg-red-100 text-red-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
}
