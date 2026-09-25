import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="app-surface min-h-screen">
      <Navbar />
      <main className="px-3 pb-28 pt-4 sm:px-6 lg:ml-80 lg:p-8">
        <div className="mx-auto max-w-[1440px] float-panel">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
