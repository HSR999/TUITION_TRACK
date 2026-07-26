export default function Alert({ type = "info", children }) {
  const styles = {
    info: "border-blue-100 bg-blue-50 text-blue-700",
    success: "border-emerald-100 bg-emerald-50 text-emerald-700",
    error: "border-red-100 bg-red-50 text-red-700",
    warning: "border-amber-100 bg-amber-50 text-amber-700",
  };

  return (
    <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}
