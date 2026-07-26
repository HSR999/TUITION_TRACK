export default function EmptyState({ title, message, action }) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-xl">
        ✨
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-800">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
