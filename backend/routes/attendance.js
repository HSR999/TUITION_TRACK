const express = require("express");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const protect = require("../middleware/protect");

const router = express.Router();
router.use(protect);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

router.get("/", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    if (!DATE_PATTERN.test(date)) return res.status(400).json({ message: "Date must use YYYY-MM-DD format" });
    const studentQuery = { teacherId: req.teacher._id };
    if (req.query.class) studentQuery.class = req.query.class;

    const students = await Student.find(studentQuery).sort({ class: 1, name: 1 }).lean();
    const records = await Attendance.find({ teacherId: req.teacher._id, date }).lean();
    const byStudent = new Map(records.map((record) => [record.studentId.toString(), record]));
    res.json({ date, attendance: students.map((student) => ({ student, record: byStudent.get(student._id.toString()) || null })) });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch attendance", error: error.message });
  }
});

router.put("/mark", async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!DATE_PATTERN.test(date || "") || !Array.isArray(records)) return res.status(400).json({ message: "A valid date and records array are required" });
    if (records.some((record) => !["present", "absent"].includes(record.status))) return res.status(400).json({ message: "Attendance status must be present or absent" });

    const studentIds = records.map((record) => record.studentId);
    const ownedCount = await Student.countDocuments({ _id: { $in: studentIds }, teacherId: req.teacher._id });
    if (ownedCount !== new Set(studentIds).size) return res.status(403).json({ message: "One or more students are invalid" });

    await Attendance.bulkWrite(records.map((record) => ({
      updateOne: {
        filter: { teacherId: req.teacher._id, studentId: record.studentId, date },
        update: { $set: { status: record.status } },
        upsert: true,
      },
    })));
    res.json({ message: "Attendance saved", count: records.length });
  } catch (error) {
    res.status(400).json({ message: "Could not save attendance", error: error.message });
  }
});

module.exports = router;
