import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="app-surface min-h-screen">
      <Navbar />
      <main className="app-main p-4 sm:p-6 lg:p-6">
        <div className="mx-auto max-w-7xl float-panel">
          <div className="mb-5 flex items-center justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Workspace / overview</p>
            <span className="hidden items-center gap-2 text-xs font-semibold text-slate-400 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Live workspace
            </span>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
