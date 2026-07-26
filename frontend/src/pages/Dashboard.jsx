import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/axios";
import Alert from "../components/Alert";
import AppIcon from "../components/AppIcon";
import LoadingState from "../components/LoadingState";
import SmartInsights from "../components/SmartInsights";
import StatusBadge from "../components/StatusBadge";
import { formatCurrency, getErrorMessage } from "../utils/format";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard")
      .then((response) => setData(response.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!data) return <LoadingState label="Loading dashboard" />;

  const { stats, feeCollection, revenueChart } = data;
  const collectionRows = [
    ["Paid fees", feeCollection.paid, "paid"],
    ["Partial fees", feeCollection.partial, "partial"],
    ["Due fees", feeCollection.due, "due"],
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-3xl bg-white/95 px-5 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">Dashboard</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Tuition overview</h1>
          </div>

          <div className="flex min-w-0 items-center gap-3 rounded-3xl bg-white/95 px-4 py-3 text-sm font-semibold text-slate-500 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <AppIcon name="calendar" className="h-9 w-9" />
            <span className="truncate">Current month · {data.month}</span>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Business readings</h2>
              <p className="text-sm text-slate-500">Quick numbers like the utilities cards in your reference</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricTile title="Students" value={stats.totalStudents} unit="active" detail="Total enrolled" tint="from-indigo-50 to-indigo-100/60" icon="students" />
            <MetricTile title="Revenue" value={formatCurrency(stats.monthlyRevenue)} unit="" detail={`Net ${formatCurrency(stats.netProfit)}`} tint="from-emerald-50 to-teal-100/60" icon="revenue" />
            <MetricTile title="Attendance" value={stats.avgAttendance} unit="%" detail="Average this month" tint="from-amber-50 to-yellow-100/70" icon="attendance" />
          </div>
        </div>

        <SmartInsights stats={stats} feeCollection={feeCollection} />

        <section className="card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Tuition report</h2>
              <p className="text-sm text-slate-500">Fee collection status and six month revenue trend</p>
            </div>
            <button className="btn-primary">View reports</button>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-3xl border border-slate-100">
              <table className="w-full">
                <thead>
                  <tr><th>Name</th><th>Count</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {collectionRows.map(([label, count, status], index) => (
                    <tr key={label} className={index % 2 === 0 ? "bg-indigo-50/45" : ""}>
                      <td className="font-semibold text-slate-700">{label}</td>
                      <td className="font-bold text-indigo-600">{count}</td>
                      <td><StatusBadge status={status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="h-72 rounded-3xl bg-slate-50/70 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#6677cc" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </section>

      <aside className="space-y-6">
        <section className="card p-5">
          <div className="flex items-center gap-3">
            <AppIcon name="teacher" className="h-14 w-14" />
            <div>
              <p className="font-black text-slate-900">Teacher account</p>
              <p className="text-xs text-emerald-500">Verified dashboard</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <SideStat label="Pending fees" value={formatCurrency(stats.pendingFees)} />
            <SideStat label="Expenses" value={formatCurrency(stats.monthlyExpenses)} />
            <SideStat label="Net profit" value={formatCurrency(stats.netProfit)} />
          </div>
        </section>

        <section className="card overflow-hidden p-5">
          <p className="text-lg font-black text-slate-900">Payment focus</p>
          <p className="mt-1 text-sm text-slate-500">Follow up dues before they pile up.</p>
          <div className="mt-5 rounded-3xl bg-indigo-50 p-4">
            <p className="text-sm font-bold text-indigo-700">{feeCollection.due} due students</p>
            <p className="mt-1 text-xs text-indigo-500">Use the Fees page reminder button to open prepared WhatsApp messages.</p>
          </div>
        </section>
      </aside>
    </div>
  );
}

function MetricTile({ title, value, unit, detail, tint, icon }) {
  return (
    <div className={`rounded-3xl bg-gradient-to-br ${tint} p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70`}>
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/70">
          <AppIcon name={icon} className="h-6 w-6" />
        </span>
        <span className="text-xs font-bold text-emerald-500">Live</span>
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-black text-indigo-600">
        {value} <span className="text-sm">{unit}</span>
      </p>
      <p className="mt-2 text-xs font-medium text-slate-500">{detail}</p>
    </div>
  );
}

function SideStat({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="font-black text-slate-900">{value}</span>
    </div>
  );
}
