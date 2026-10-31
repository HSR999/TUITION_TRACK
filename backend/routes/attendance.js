const express = require("express");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const protect = require("../middleware/protect");
const { getCreateOwnership, withDataScope } = require("../utils/access");
const { getIndiaDateKey, isValidDateKey } = require("../utils/validation");

const router = express.Router();
router.use(protect);
router.get("/", async (req, res) => {
  try {
    const date = req.query.date || getIndiaDateKey();
    if (!isValidDateKey(date)) return res.status(400).json({ message: "Date must be a real date in YYYY-MM-DD format" });
    const studentFilters = { isArchived: { $ne: true } };
    if (req.query.class) studentFilters.class = req.query.class;
    const studentQuery = withDataScope(req, studentFilters);

    const students = await Student.find(studentQuery).sort({ class: 1, name: 1 }).lean();
    const records = await Attendance.find(withDataScope(req, { date })).lean();
    const byStudent = new Map(records.map((record) => [record.studentId.toString(), record]));
    res.json({ date, attendance: students.map((student) => ({ student, record: byStudent.get(student._id.toString()) || null })) });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch attendance", error: error.message });
  }
});

router.put("/mark", async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!isValidDateKey(date) || !Array.isArray(records) || records.length === 0) return res.status(400).json({ message: "A valid date and non-empty records array are required" });
    if (date < getIndiaDateKey()) return res.status(403).json({ message: "Past attendance is read-only" });
    if (records.some((record) => !["present", "absent"].includes(record.status))) return res.status(400).json({ message: "Attendance status must be present or absent" });

    const studentIds = records.map((record) => record.studentId);
    if (new Set(studentIds).size !== studentIds.length) return res.status(400).json({ message: "Attendance records cannot include duplicate students" });
    const ownedCount = await Student.countDocuments(withDataScope(req, { _id: { $in: studentIds }, isArchived: { $ne: true } }));
    if (ownedCount !== new Set(studentIds).size) return res.status(403).json({ message: "One or more students are invalid" });

    await Attendance.bulkWrite(records.map((record) => ({
      updateOne: {
        filter: { teacherId: req.teacher._id, studentId: record.studentId, date },
        update: { $set: { ...getCreateOwnership(req), status: record.status } },
        upsert: true,
      },
    })));
    res.json({ message: "Attendance saved", count: records.length });
  } catch (error) {
    res.status(400).json({ message: "Could not save attendance", error: error.message });
  }
});

module.exports = router;
