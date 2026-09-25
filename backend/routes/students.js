const express = require("express");
const Student = require("../models/Student");
const FeeRecord = require("../models/FeeRecord");
const Attendance = require("../models/Attendance");
const NotificationLog = require("../models/NotificationLog");
const protect = require("../middleware/protect");
const { getCreateOwnership, withDataScope } = require("../utils/access");

const router = express.Router();
router.use(protect);

const editableFields = [
  "name",
  "phone",
  "parentName",
  "parentPhone",
  "parentEmail",
  "class",
  "feeAmount",
  "feeDueDate",
  "address",
  "joinedAt",
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.get("/", async (req, res) => {
  try {
    const filters = {};
    if (req.query.class) filters.class = req.query.class;
    if (req.query.search) {
      const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
      filters.$or = [
        { name: search },
        { phone: search },
        { parentName: search },
        { parentPhone: search },
      ];
    }
    const query = withDataScope(req, filters);

    const students = await Student.find(query).sort({ class: 1, name: 1 });
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch students", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = Object.fromEntries(editableFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    const student = await Student.create({ ...data, ...getCreateOwnership(req) });
    res.status(201).json({ message: "Student added", student });
  } catch (error) {
    res.status(400).json({ message: "Could not add student", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findOne(withDataScope(req, { _id: req.params.id }));
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ student });
  } catch (error) {
    res.status(400).json({ message: "Invalid student id", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updates = Object.fromEntries(editableFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    const student = await Student.findOneAndUpdate(
      withDataScope(req, { _id: req.params.id }),
      updates,
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student updated", student });
  } catch (error) {
    res.status(400).json({ message: "Could not update student", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const student = await Student.findOneAndDelete(withDataScope(req, { _id: req.params.id }));
    if (!student) return res.status(404).json({ message: "Student not found" });

    await Promise.all([
      FeeRecord.deleteMany(withDataScope(req, { studentId: student._id })),
      Attendance.deleteMany(withDataScope(req, { studentId: student._id })),
      NotificationLog.deleteMany(withDataScope(req, { studentId: student._id })),
    ]);
    res.json({ message: "Student and related records deleted" });
  } catch (error) {
    res.status(400).json({ message: "Could not delete student", error: error.message });
  }
});

module.exports = router;
