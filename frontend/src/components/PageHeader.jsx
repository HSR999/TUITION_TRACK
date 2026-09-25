export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">TuitionTrack Console</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-col gap-2 sm:flex-row [&>*]:w-full sm:[&>*]:w-auto">{action}</div>}
    </div>
  );
}
