export default function ClassCard({ className, count, active, onClick }) {
  return (
    <button onClick={onClick} className={`rounded-2xl border p-5 text-left transition ${active ? "border-brand-600 bg-brand-50 shadow-sm" : "border-slate-200 bg-white hover:border-brand-500"}`}>
      <p className="text-sm font-semibold text-slate-500">Class</p>
      <p className="mt-1 text-3xl font-black text-brand-700">{className}</p>
      <p className="mt-3 text-sm text-slate-500">{count} student{count !== 1 ? "s" : ""}</p>
    </button>
  );
}
