import { useState } from "react";
import { Navigate } from "react-router-dom";
import Alert from "../components/Alert";
import AppIcon from "../components/AppIcon";
import ShapeGrid from "../components/ShapeGrid";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/format";

export default function Login() {
  const { teacher, login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (teacher) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await (mode === "login" ? login(form) : register(form));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const useDemoAccount = async () => {
    setMode("login");
    setError("");
    setSubmitting(true);
    const demoForm = { email: "demo@tuitiontrack.com", password: "Demo@12345" };
    setForm({ name: "", ...demoForm });

    try {
      await login(demoForm);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <ShapeGrid
        speed={0.47}
        squareSize={51}
        size={51}
        direction="diagonal"
        borderColor="rgba(45, 212, 191, 0.16)"
        hoverFillColor="#02ff2a"
        hoverColor="#02ff2a"
        shape="square"
        hoverTrailAmount={6}
        className="absolute inset-0"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.2)_42%,rgba(2,6,23,0.78)_100%)]" />

      <section className="relative z-10 grid min-h-screen place-items-center p-5">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white/95 shadow-2xl shadow-emerald-950/50 backdrop-blur-xl lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:block">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
            <div className="absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />

            <div className="relative flex items-center gap-3">
              <AppIcon name="logo" className="h-12 w-12" />
              <div>
                <p className="text-2xl font-black">TuitionTrack</p>
                <p className="text-sm text-emerald-100/75">Teacher dashboard</p>
              </div>
            </div>

            <div className="relative mt-24">
              <p className="text-4xl font-black leading-tight">Manage tuition with clarity.</p>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Students, fees, attendance, expenses, reminders and receipts in one clean MERN workspace.
              </p>
            </div>

            <div className="relative mt-10 grid gap-3">
              {[
                ["security", "JWT secured login"],
                ["reminder", "Automated fee reminders"],
                ["pdf", "PDF receipts + analytics"],
              ].map(([icon, item]) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold backdrop-blur">
                  <AppIcon name={icon} className="h-5 w-5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>

          <form onSubmit={submit} className="p-7 sm:p-10 lg:px-20 lg:py-16">
            <div className="mx-auto max-w-md">
              <AppIcon name="logo" className="mx-auto h-12 w-12" />
              <div className="mt-5 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-700">TuitionTrack</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  {mode === "login" ? "Sign in" : "Create account"}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {mode === "login" ? "Access your teacher dashboard." : "Start your teacher workspace."}
                </p>
              </div>

              <div className="mt-8 space-y-4">
                {mode === "register" && (
                  <label>
                    <span className="label">Name</span>
                    <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                  </label>
                )}
                <label>
                  <span className="label">Email</span>
                  <input className="input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
                </label>
                <label>
                  <span className="label">Password</span>
                  <input className="input" type="password" minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
                </label>
              </div>

              {error && <div className="mt-4"><Alert type="error">{error}</Alert></div>}

              <button className="btn-primary mt-6 w-full" disabled={submitting}>
                {submitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
              </button>

              <button
                type="button"
                className="btn-secondary mt-3 w-full"
                onClick={useDemoAccount}
                disabled={submitting}
              >
                Use demo account
              </button>

              <button
                type="button"
                className="mt-5 w-full text-sm font-semibold text-brand-700"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                }}
              >
                {mode === "login" ? "New to TuitionTrack? Create an account" : "Already registered? Sign in"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
