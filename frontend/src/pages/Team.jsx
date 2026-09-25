import { useEffect, useState } from "react";
import Alert from "../components/Alert";
import AppIcon from "../components/AppIcon";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/format";

const emptyTeacher = {
  name: "",
  email: "",
  password: "",
  phone: "",
};

export default function Team() {
  const { teacher } = useAuth();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(emptyTeacher);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isOwner = teacher?.role === "owner";

  const loadMembers = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/team");
      setMembers(data.members || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) loadMembers();
    else setLoading(false);
  }, [isOwner]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.post("/team", form);
      setMembers((current) => [...current, data.member]);
      setForm(emptyTeacher);
      setSuccess("Teacher added. They can now login with this email and password.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon="team"
          title="Team"
          subtitle="Only the institute owner can manage teachers."
        />
        <Alert type="error">You are logged in as a teacher, so team management is hidden.</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="team"
        title="Team & Institute"
        subtitle="Keep your sister's solo workflow simple, and add teachers only when needed."
      />

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            {teacher?.institute?.logoUrl ? (
              <img src={teacher.institute.logoUrl} alt="" className="h-16 w-16 rounded-3xl object-cover shadow-sm" />
            ) : (
              <AppIcon name="logo" className="h-16 w-16" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-700">Institute workspace</p>
              <h2 className="mt-1 truncate text-2xl font-black text-slate-950">
                {teacher?.institute?.name || "Your Tuition"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Owner: {teacher?.name}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
            <p className="font-black">Simple by default</p>
            <p className="mt-1">
              If only one person uses the app, nothing changes. Your sister can manage students,
              fees, attendance, expenses and reminders alone. Add teachers only when the institute grows.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="card p-6">
          <div className="flex items-center gap-3">
            <AppIcon name="teacher" className="h-10 w-10" />
            <div>
              <h2 className="text-xl font-black text-slate-950">Add teacher</h2>
              <p className="text-sm text-slate-500">Optional team access for future growth.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">Teacher name</span>
              <input
                className="input"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </label>
            <label>
              <span className="label">Phone optional</span>
              <input
                className="input"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </label>
            <label>
              <span className="label">Email</span>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </label>
            <label>
              <span className="label">Temporary password</span>
              <input
                className="input"
                type="password"
                minLength="6"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </label>
          </div>

          {error && <div className="mt-4"><Alert type="error">{error}</Alert></div>}
          {success && <div className="mt-4"><Alert>{success}</Alert></div>}

          <button className="btn-primary mt-5 w-full sm:w-auto" disabled={submitting}>
            {submitting ? "Adding..." : "Add teacher"}
          </button>
        </form>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">Team members</h2>
            <p className="text-sm text-slate-500">Owner and teachers under this institute.</p>
          </div>
          <span className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {members.length} users
          </span>
        </div>

        {loading ? (
          <LoadingState label="Loading team" />
        ) : members.length === 0 ? (
          <EmptyState icon="team" title="No team members yet" description="The owner account will appear here after refresh." />
        ) : (
          <div className="grid gap-3">
            {members.map((member) => (
              <div key={member.id} className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-sm font-black text-brand-700 shadow-sm">
                    {member.name?.slice(0, 1)?.toUpperCase() || "T"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-900">{member.name}</p>
                    <p className="truncate text-sm text-slate-500">{member.email}</p>
                  </div>
                </div>
                <span className={`w-fit rounded-2xl px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${
                  member.role === "owner" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                }`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
