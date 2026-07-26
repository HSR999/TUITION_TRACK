import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="app-surface min-h-screen">
      <Navbar />
      <main className="p-4 sm:p-6 lg:ml-80 lg:p-6">
        <div className="mx-auto max-w-7xl float-panel">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
