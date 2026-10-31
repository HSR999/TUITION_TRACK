import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Alert from "../components/Alert";
import ClassCard from "../components/ClassCard";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import StudentModal from "../components/StudentModal";
import { formatCurrency, getErrorMessage } from "../utils/format";
import { getClassOptions } from "../utils/classes";
import { useToast } from "../context/ToastContext";

export default function Students() {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [modal, setModal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const { data } = await api.get("/students", { params: { includeArchived: includeArchived || undefined } });
      setStudents(data.students);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [includeArchived]);

  const visible = useMemo(() => students.filter((student) => (
    (!selectedClass || String(student.class).trim() === selectedClass)
    && [student.name, student.phone, student.parentName, student.parentPhone]
      .some((value) => value?.toLowerCase().includes(search.toLowerCase()))
  )), [students, selectedClass, search]);
  const classes = useMemo(() => getClassOptions(students), [students]);

  const save = async (form) => {
    setSaving(true);
    setError("");
    try {
      modal ? await api.put(`/students/${modal._id}`, form) : await api.post("/students", form);
      setShowModal(false);
      setModal(null);
      toast(modal ? "Student updated successfully" : "Student added successfully");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const archive = async (student) => {
    if (!window.confirm(`Archive ${student.name}? Their attendance and fee history will be kept.`)) return;
    try {
      await api.patch(`/students/${student._id}/archive`);
      toast("Student archived; history is preserved");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const restore = async (student) => {
    try {
      await api.patch(`/students/${student._id}/restore`);
      toast("Student restored");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const addButton = (
    <button className="btn-primary" onClick={() => { setModal(null); setShowModal(true); }}>
      + Add student
    </button>
  );

  return (
    <>
      <PageHeader title="Students" subtitle="Manage student and parent details" action={addButton} />
      {error && <Alert type="error">{error}</Alert>}

      {classes.length > 0 && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {classes.map((item) => (
          <ClassCard
            key={item}
            className={item}
            count={students.filter((student) => String(student.class).trim() === item).length}
            active={selectedClass === item}
            onClick={() => setSelectedClass(selectedClass === item ? "" : item)}
          />
        ))}
      </div>}

      <div className="my-5 flex flex-col gap-3 sm:flex-row">
        <input className="input max-w-md" placeholder="Search student or parent..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <button className="btn-secondary" onClick={() => setSelectedClass("")}>All students ({students.length})</button>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" checked={includeArchived} onChange={(event) => { setSelectedClass(""); setIncludeArchived(event.target.checked); }} />
          Include archived
        </label>
      </div>

      {loading ? (
        <LoadingState label="Loading students" />
      ) : students.length === 0 ? (
        <EmptyState title={includeArchived ? "No students found" : "No active students"} message={includeArchived ? "Try another search or add a student." : "Add your first student to unlock fee tracking, attendance and receipts."} action={!includeArchived ? addButton : null} />
      ) : (
        <div className="table-wrap">
          <table className="w-full">
            <thead>
              <tr><th>Student</th><th>Class</th><th>Parent</th><th>Monthly fee</th><th>Due day</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {visible.map((student) => (
                <tr key={student._id}>
                  <td><strong>{student.name}</strong><p className="text-xs text-slate-400">{student.phone || "No student phone"}</p>{student.isArchived && <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Archived</span>}</td>
                  <td>Class {student.class}</td>
                  <td>{student.parentName}<p className="text-xs text-slate-400">{student.parentPhone}</p></td>
                  <td>{formatCurrency(student.feeAmount)}</td>
                  <td>{student.feeDueDate}</td>
                  <td>
                    <div className="flex gap-3">
                      {!student.isArchived && <button className="font-semibold text-brand-700" onClick={() => { setModal(student); setShowModal(true); }}>Edit</button>}
                      {student.isArchived
                        ? <button className="font-semibold text-emerald-700" onClick={() => restore(student)}>Restore</button>
                        : <button className="font-semibold text-slate-500" onClick={() => archive(student)}>Archive</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <div className="p-5"><EmptyState title="No matching students" message="Try another search term or clear the class filter." /></div>}
        </div>
      )}

      {showModal && <StudentModal student={modal} classOptions={classes} saving={saving} onClose={() => setShowModal(false)} onSave={save} />}
    </>
  );
}
