import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppIcon from "./AppIcon";

const links = [
  ["dashboard", "Dashboard", "/"],
  ["students", "Students", "/students"],
  ["fees", "Fees", "/fees"],
  ["attendance", "Attendance", "/attendance"],
  ["expenses", "Expenses", "/expenses"],
  ["receipts", "Receipts", "/receipts"],
  ["notifications", "Reminders", "/notifications"],
];

export default function Navbar() {
  const { teacher, logout } = useAuth();
  const navLinks = teacher?.role === "owner" ? [...links, ["team", "Team", "/team"]] : links;
  const instituteName = teacher?.institute?.name || "TuitionTrack";
  const logoUrl = teacher?.institute?.logoUrl;
  const logo = logoUrl
    ? <img src={logoUrl} alt="" className="h-10 w-10 rounded-2xl object-cover" />
    : <AppIcon name="logo" className="h-10 w-10 shrink-0" />;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {logo}
            <div className="min-w-0">
              <p className="truncate text-lg font-black tracking-tight text-indigo-950">{instituteName}</p>
              <p className="truncate text-xs text-slate-500">{teacher?.role === "owner" ? "Owner workspace" : "Teacher workspace"}</p>
            </div>
          </div>
          <button onClick={logout} className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
            Logout
          </button>
        </div>
      </header>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex gap-1 overflow-x-auto rounded-[1.6rem] border border-white/80 bg-white/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:hidden">
        {navLinks.map(([icon, label, path]) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) => `flex min-w-[4.6rem] flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[0.68rem] font-bold transition ${
              isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-500"
            }`}
          >
            <AppIcon name={icon} className="h-5 w-5" />
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <aside className="z-20 hidden border-white/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur-xl lg:fixed lg:inset-y-6 lg:left-6 lg:flex lg:w-64 lg:rounded-[2rem]">
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-between px-6 py-6">
            <div className="flex items-center gap-3">
              {logoUrl ? <img src={logoUrl} alt="" className="h-11 w-11 rounded-2xl object-cover" /> : <AppIcon name="logo" className="h-11 w-11" />}
              <div>
                <p className="max-w-[9.5rem] truncate text-xl font-black tracking-tight text-indigo-950">{instituteName}</p>
                <p className="-mt-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-700">TuitionTrack</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-2 px-4 pb-4">
            {navLinks.map(([icon, label, path]) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                className={({ isActive }) => `floating-tab flex items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 shadow-[0_12px_30px_rgba(79,100,190,0.14)]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-indigo-700"
                }`}
              >
                <AppIcon name={icon} className="h-6 w-6" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-5">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-400">SIGNED IN</p>
              <p className="mt-2 truncate text-sm font-bold text-slate-800">{teacher?.name}</p>
              <p className="truncate text-xs text-slate-500">{teacher?.role === "owner" ? "Owner" : "Teacher"} • {teacher?.email}</p>
              <button onClick={logout} className="mt-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-red-500 shadow-sm transition hover:-translate-y-0.5">
                <AppIcon name="logout" className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
