import StatusBadge from "./StatusBadge";

export default function FeeCalendar({ month, fees }) {
  const [year, monthNumber] = month.split("-").map(Number);
  const days = new Date(year, monthNumber, 0).getDate();
  const startDay = new Date(year, monthNumber - 1, 1).getDay();
  const entries = Array.from({ length: startDay + days }, (_, index) => index < startDay ? null : index - startDay + 1);
  const byDay = fees.reduce((map, item) => {
    const day = Math.min(item.student.feeDueDate, days);
    map[day] = [...(map[day] || []), item];
    return map;
  }, {});
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 bg-slate-50">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="p-2 text-center text-xs font-bold text-slate-500">{day}</div>)}</div>
      <div className="grid grid-cols-7">{entries.map((day, index) => (
        <div key={index} className="min-h-24 border-r border-t border-slate-100 p-2">
          {day && <><p className="text-xs font-bold text-slate-500">{day}</p><div className="mt-1 space-y-1">{(byDay[day] || []).slice(0, 3).map((item) => <div key={item.student._id} className="truncate text-[11px]" title={item.student.name}>{item.student.name} <StatusBadge status={item.record.status} /></div>)}</div></>}
        </div>
      ))}</div>
    </div>
  );
}
