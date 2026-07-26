import { formatCurrency } from "../utils/format";

export default function SmartInsights({ stats, feeCollection }) {
  const insights = [];

  if (stats.pendingFees > 0) {
    insights.push({
      title: "Follow up pending fees",
      text: `${feeCollection.due} students are still due. Start with manual reminders before the month-end rush.`,
      tone: "amber",
    });
  }

  if (stats.avgAttendance < 75) {
    insights.push({
      title: "Attendance needs attention",
      text: `Average attendance is ${stats.avgAttendance}%. Check absent patterns before they become drop-offs.`,
      tone: "red",
    });
  }

  if (stats.netProfit >= 0) {
    insights.push({
      title: "Healthy monthly profit",
      text: `Current net profit is ${formatCurrency(stats.netProfit)} after expenses.`,
      tone: "emerald",
    });
  } else {
    insights.push({
      title: "Expenses are higher than revenue",
      text: `Net profit is ${formatCurrency(stats.netProfit)}. Review rent, supplies, and travel spending.`,
      tone: "red",
    });
  }

  const styles = {
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    red: "border-red-100 bg-red-50 text-red-800",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
  };

  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Smart insights</p>
          <h2 className="mt-1 text-lg font-black">AI-style business signals</h2>
          <p className="mt-1 text-sm text-slate-500">Rule-based insights today, easily upgradeable to an AI assistant later.</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">Interview feature</span>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {insights.map((item) => (
          <div key={item.title} className={`rounded-2xl border p-4 ${styles[item.tone]}`}>
            <p className="font-bold">{item.title}</p>
            <p className="mt-1 text-sm opacity-85">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
