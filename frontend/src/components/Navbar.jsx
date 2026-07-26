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
  ["notifications", "Notifications", "/notifications"],
];

export default function Navbar() {
  const { teacher, logout } = useAuth();

  return (
    <aside className="z-20 border-b border-white/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur-xl lg:fixed lg:inset-y-6 lg:left-6 lg:w-64 lg:rounded-[2rem] lg:border-b-0">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <AppIcon name="logo" className="h-11 w-11" />
            <div>
              <p className="text-2xl font-black tracking-tight text-indigo-950">Tuition</p>
              <p className="-mt-1 text-2xl font-black tracking-tight text-brand-700">Track</p>
            </div>
          </div>
          <button onClick={logout} className="text-xs font-semibold text-slate-500 lg:hidden">Logout</button>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-1 lg:flex-col lg:overflow-visible">
          {links.map(([icon, label, path]) => (
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

        <div className="hidden p-5 lg:block">
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-400">SIGNED IN</p>
            <p className="mt-2 truncate text-sm font-bold text-slate-800">{teacher?.name}</p>
            <p className="truncate text-xs text-slate-500">{teacher?.email}</p>
            <button onClick={logout} className="mt-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-red-500 shadow-sm transition hover:-translate-y-0.5">
              <AppIcon name="logout" className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
