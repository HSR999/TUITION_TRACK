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
  const [modal, setModal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const { data } = await api.get("/students");
      setStudents(data.students);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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

  const remove = async (student) => {
    if (!window.confirm(`Delete ${student.name} and all related records?`)) return;
    try {
      await api.delete(`/students/${student._id}`);
      toast("Student deleted successfully");
      load();
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
      </div>

      {loading ? (
        <LoadingState label="Loading students" />
      ) : students.length === 0 ? (
        <EmptyState title="No students yet" message="Add your first student to unlock fee tracking, attendance and receipts." action={addButton} />
      ) : (
        <div className="table-wrap">
          <table className="w-full">
            <thead>
              <tr><th>Student</th><th>Class</th><th>Parent</th><th>Monthly fee</th><th>Due day</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {visible.map((student) => (
                <tr key={student._id}>
                  <td><strong>{student.name}</strong><p className="text-xs text-slate-400">{student.phone}</p></td>
                  <td>Class {student.class}</td>
                  <td>{student.parentName}<p className="text-xs text-slate-400">{student.parentPhone}</p></td>
                  <td>{formatCurrency(student.feeAmount)}</td>
                  <td>{student.feeDueDate}</td>
                  <td>
                    <div className="flex gap-3">
                      <button className="font-semibold text-brand-700" onClick={() => { setModal(student); setShowModal(true); }}>Edit</button>
                      <button className="font-semibold text-red-600" onClick={() => remove(student)}>Delete</button>
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
