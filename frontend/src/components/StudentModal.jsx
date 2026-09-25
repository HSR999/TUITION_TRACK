import { useEffect, useState } from "react";

const emptyForm = {
  name: "", phone: "", parentName: "", parentPhone: "", parentEmail: "",
  class: "9", feeAmount: "", feeDueDate: "5", address: "",
};

const fields = [
  ["name", "Student name", "text", true],
  ["phone", "Student phone", "tel", true],
  ["parentName", "Parent name", "text", true],
  ["parentPhone", "Parent WhatsApp number", "tel", true],
  ["parentEmail", "Parent email (optional)", "email", false],
  ["feeAmount", "Monthly fee", "number", true],
  ["feeDueDate", "Due day (1-31)", "number", true],
];

export default function StudentModal({ student, onClose, onSave, saving }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => setForm(student ? { ...emptyForm, ...student } : emptyForm), [student]);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    onSave({ ...form, feeAmount: Number(form.feeAmount), feeDueDate: Number(form.feeDueDate) });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/40 p-0 sm:place-items-center sm:p-4" onMouseDown={onClose}>
      <form onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{student ? "Edit student" : "Add student"}</h2>
            <p className="text-sm text-slate-500">Parent phone is used to open WhatsApp with prepared reminders.</p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-400">×</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(([name, label, type, required]) => (
            <label key={name}>
              <span className="label">{label}</span>
              <input
                className="input"
                name={name}
                type={type}
                value={form[name]}
                onChange={update}
                required={required}
                min={name === "feeDueDate" ? 1 : undefined}
                max={name === "feeDueDate" ? 31 : undefined}
              />
            </label>
          ))}

          <label>
            <span className="label">Class</span>
            <select className="input" name="class" value={form.class} onChange={update}>
              {["9", "10", "11"].map((item) => <option key={item} value={item}>Class {item}</option>)}
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className="label">Address</span>
            <textarea className="input min-h-20" name="address" value={form.address} onChange={update} />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save student"}</button>
        </div>
      </form>
    </div>
  );
}
