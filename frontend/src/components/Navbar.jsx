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
    <aside className="sidebar-shell">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-6 py-6">
          <AppIcon name="logo" className="brand-mark h-14 w-14 lg:h-16 lg:w-16" />
          <button type="button" onClick={logout} className="mobile-logout" aria-label="Log out" title="Log out">
            <AppIcon name="logout" className="h-5 w-5" />
          </button>
        </div>

        <nav className="sidebar-nav flex gap-2 px-4 pb-4 lg:flex-1 lg:flex-col">
          {links.map(([icon, label, path]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              data-label={label}
              className={({ isActive }) => `floating-tab nav-item flex items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold ${isActive ? "active" : ""} ${
                isActive
                  ? ""
                  : "text-slate-500 hover:bg-slate-50 hover:text-indigo-700"
              }`}
            >
              <AppIcon name={icon} className="nav-icon h-6 w-6" />
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden p-5 lg:block">
          <button type="button" className="profile-control rounded-3xl bg-slate-50 p-4" onClick={logout} title="Log out">
            <p className="text-xs font-semibold text-slate-400">SIGNED IN</p>
            <p className="mt-2 truncate text-sm font-bold text-slate-800">{teacher?.name}</p>
            <p className="truncate text-xs text-slate-500">{teacher?.email}</p>
            <span className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-red-500 shadow-sm transition">
              <AppIcon name="logout" className="h-4 w-4" />
              Log out
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
