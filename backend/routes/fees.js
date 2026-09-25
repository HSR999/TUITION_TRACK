const express = require("express");
const Student = require("../models/Student");
const FeeRecord = require("../models/FeeRecord");
const protect = require("../middleware/protect");
const { MONTH_PATTERN, currentMonth } = require("../utils/month");
const { getCreateOwnership, withDataScope } = require("../utils/access");

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  try {
    const month = req.query.month || currentMonth();
    if (!MONTH_PATTERN.test(month)) return res.status(400).json({ message: "Month must use YYYY-MM format" });

    const studentFilters = {};
    if (req.query.class) studentFilters.class = req.query.class;
    const studentQuery = withDataScope(req, studentFilters);
    const students = await Student.find(studentQuery).sort({ class: 1, name: 1 }).lean();
    const records = await FeeRecord.find(withDataScope(req, { month })).lean();
    const recordByStudent = new Map(records.map((record) => [record.studentId.toString(), record]));

    const fees = students.map((student) => ({
      student,
      record: recordByStudent.get(student._id.toString()) || {
        studentId: student._id,
        month,
        amountPaid: 0,
        amountDue: student.feeAmount,
        status: "due",
        paidOn: null,
        receiptNumber: null,
      },
    }));
    res.json({ month, fees });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch fees", error: error.message });
  }
});

router.put("/:studentId/:month", async (req, res) => {
  try {
    const { studentId, month } = req.params;
    const amountPaid = Number(req.body.amountPaid);
    if (!MONTH_PATTERN.test(month)) return res.status(400).json({ message: "Month must use YYYY-MM format" });
    if (!Number.isFinite(amountPaid) || amountPaid < 0) return res.status(400).json({ message: "amountPaid must be a positive number or zero" });

    const student = await Student.findOne(withDataScope(req, { _id: studentId }));
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (amountPaid > student.feeAmount) return res.status(400).json({ message: "Amount paid cannot exceed the monthly fee" });

    const status = amountPaid === 0 ? "due" : amountPaid >= student.feeAmount ? "paid" : "partial";
    const ownership = getCreateOwnership(req, student.teacherId || req.teacher._id);
    const previous = await FeeRecord.findOne(withDataScope(req, { studentId, month }));
    const receiptNumber = amountPaid > 0 && amountPaid !== previous?.amountPaid
      ? `TT-${month.replace("-", "")}-${Date.now().toString().slice(-6)}`
      : previous?.receiptNumber || null;

    const record = await FeeRecord.findOneAndUpdate(
      { teacherId: ownership.teacherId, studentId, month },
      {
        instituteId: ownership.instituteId,
        amountPaid,
        amountDue: student.feeAmount,
        status,
        paidOn: amountPaid > 0 ? new Date() : null,
        receiptNumber,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ message: "Fee record updated", record, student });
  } catch (error) {
    res.status(400).json({ message: "Could not update fee", error: error.message });
  }
});

router.get("/record/:id", async (req, res) => {
  try {
    const record = await FeeRecord.findOne(withDataScope(req, { _id: req.params.id })).populate("studentId");
    if (!record) return res.status(404).json({ message: "Fee record not found" });
    res.json({ record });
  } catch (error) {
    res.status(400).json({ message: "Could not fetch receipt", error: error.message });
  }
});

module.exports = router;
