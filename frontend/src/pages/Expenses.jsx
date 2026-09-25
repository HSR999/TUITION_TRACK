import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import { currentMonth, formatCurrency, formatDate, getErrorMessage, today } from "../utils/format";
import { useToast } from "../context/ToastContext";

const empty = { title: "", amount: "", date: today(), category: "other" };
export default function Expenses() {
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonth()); const [expenses, setExpenses] = useState([]); const [form, setForm] = useState(empty); const [editing, setEditing] = useState(null); const [error, setError] = useState("");
  const load = () => api.get("/expenses", { params: { month } }).then(({ data }) => setExpenses(data.expenses)).catch((err) => setError(getErrorMessage(err)));
  useEffect(() => { load(); }, [month]);
  const total = useMemo(() => expenses.reduce((sum, item) => sum + item.amount, 0), [expenses]);
  const submit = async (event) => { event.preventDefault(); try { const payload = { ...form, amount: Number(form.amount) }; editing ? await api.put(`/expenses/${editing}`, payload) : await api.post("/expenses", payload); setForm(empty); setEditing(null); toast(editing ? "Expense updated successfully" : "Expense added successfully"); load(); } catch (err) { setError(getErrorMessage(err)); } };
  const edit = (item) => { setEditing(item._id); setForm({ title: item.title, amount: item.amount, date: item.date.slice(0, 10), category: item.category }); };
  const remove = async (id) => { if (!window.confirm("Delete this expense?")) return; await api.delete(`/expenses/${id}`); toast("Expense deleted successfully"); load(); };
  return (
    <>
      <PageHeader title="Expenses" subtitle="Know where your tuition income goes" action={<input className="input w-auto" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />} />
      {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form className="card h-fit p-5" onSubmit={submit}><h2 className="text-lg font-bold">{editing ? "Edit expense" : "Add expense"}</h2><div className="mt-4 space-y-4"><label><span className="label">Title</span><input className="input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label><label><span className="label">Amount</span><input className="input" type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></label><label><span className="label">Date</span><input className="input" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label><label><span className="label">Category</span><select className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{["rent", "utilities", "supplies", "travel", "salary", "other"].map((item) => <option key={item} value={item} className="capitalize">{item}</option>)}</select></label></div><div className="mt-5 flex gap-2"><button className="btn-primary">{editing ? "Update" : "Add expense"}</button>{editing && <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}</div></form>
        <section><div className="card mb-4 p-5"><p className="text-sm text-slate-500">Total expenses</p><p className="text-3xl font-black">{formatCurrency(total)}</p></div><div className="table-wrap"><table className="w-full"><thead><tr><th>Expense</th><th>Category</th><th>Date</th><th>Amount</th><th>Actions</th></tr></thead><tbody>{expenses.map((item) => <tr key={item._id}><td className="font-semibold">{item.title}</td><td className="capitalize">{item.category}</td><td>{formatDate(item.date)}</td><td>{formatCurrency(item.amount)}</td><td><div className="flex gap-3"><button className="font-semibold text-brand-700" onClick={() => edit(item)}>Edit</button><button className="font-semibold text-red-600" onClick={() => remove(item._id)}>Delete</button></div></td></tr>)}</tbody></table>{!expenses.length && <p className="p-8 text-center text-sm text-slate-500">No expenses this month.</p>}</div></section>
      </div>
    </>
  );
}
