export default function StatCard({ label, value, detail, tone = "teal" }) {
  const tones = {
    teal: "from-brand-50 to-white text-brand-700",
    blue: "from-blue-50 to-white text-blue-700",
    amber: "from-amber-50 to-white text-amber-700",
    violet: "from-violet-50 to-white text-violet-700",
  };

  return (
    <div className={`card bg-gradient-to-br p-5 ${tones[tone]}`}>
      <div className="mb-4 h-2 w-12 rounded-full bg-current opacity-70" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">{value}</p>
      {detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}
