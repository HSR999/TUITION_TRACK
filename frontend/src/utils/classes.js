export const getClassOptions = (students) => [...new Set(
  students.map((student) => String(student.class || "").trim()).filter(Boolean)
)].sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }));
