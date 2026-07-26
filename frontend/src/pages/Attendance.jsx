import { useEffect, useState } from "react";
import api from "../api/axios";
import Alert from "../components/Alert";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import { getErrorMessage, today } from "../utils/format";

export default function Attendance() {
  const [date, setDate] = useState(today());
  const [classFilter, setClassFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/attendance", { params: { date, class: classFilter || undefined } });
      setRows(data.attendance);
      setStatuses(Object.fromEntries(data.attendance.map((item) => [item.student._id, item.record?.status || "present"])));
    } catch (err) {
      setNoticeType("error");
      setNotice(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date, classFilter]);

  const save = async () => {
    try {
      await api.put("/attendance/mark", {
        date,
        records: rows.map((item) => ({ studentId: item.student._id, status: statuses[item.student._id] })),
      });
      setNoticeType("success");
      setNotice("Attendance saved successfully");
    } catch (err) {
      setNoticeType("error");
      setNotice(getErrorMessage(err));
    }
  };

  const presentCount = rows.filter(({ student }) => statuses[student._id] === "present").length;

  return (
    <>
      <PageHeader title="Attendance" subtitle="Mark daily presence for each class" action={<button className="btn-primary" onClick={save} disabled={!rows.length}>Save attendance</button>} />
      {notice && <Alert type={noticeType}>{notice}</Alert>}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input className="input w-auto" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <select className="input w-auto" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
          <option value="">All classes</option>
          {["9", "10", "11"].map((item) => <option key={item} value={item}>Class {item}</option>)}
        </select>
        <div className="rounded-2xl bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600">
          Present {presentCount}/{rows.length}
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading attendance" />
      ) : rows.length === 0 ? (
        <EmptyState title="No students found" message="Add students first or change the class filter." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ student }) => (
            <div className="card flex items-center justify-between p-4" key={student._id}>
              <div>
                <p className="font-bold">{student.name}</p>
                <p className="text-xs text-slate-500">Class {student.class}</p>
              </div>
              <div className="flex rounded-xl bg-slate-100 p-1">
                {["present", "absent"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatuses({ ...statuses, [student._id]: status })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${
                      statuses[student._id] === status
                        ? status === "present" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
