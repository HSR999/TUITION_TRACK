const express = require("express");
const Student = require("../models/Student");
const FeeRecord = require("../models/FeeRecord");
const protect = require("../middleware/protect");
const { MONTH_PATTERN, currentMonth } = require("../utils/month");

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  try {
    const month = req.query.month || currentMonth();
    if (!MONTH_PATTERN.test(month)) return res.status(400).json({ message: "Month must use YYYY-MM format" });

    const studentQuery = { teacherId: req.teacher._id };
    if (req.query.class) studentQuery.class = req.query.class;
    const students = await Student.find(studentQuery).sort({ class: 1, name: 1 }).lean();
    const records = await FeeRecord.find({ teacherId: req.teacher._id, month }).lean();
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

    const student = await Student.findOne({ _id: studentId, teacherId: req.teacher._id });
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (amountPaid > student.feeAmount) return res.status(400).json({ message: "Amount paid cannot exceed the monthly fee" });

    const status = amountPaid === 0 ? "due" : amountPaid >= student.feeAmount ? "paid" : "partial";
    const previous = await FeeRecord.findOne({ teacherId: req.teacher._id, studentId, month });
    const receiptNumber = amountPaid > 0 && amountPaid !== previous?.amountPaid
      ? `TT-${month.replace("-", "")}-${Date.now().toString().slice(-6)}`
      : previous?.receiptNumber || null;

    const record = await FeeRecord.findOneAndUpdate(
      { teacherId: req.teacher._id, studentId, month },
      {
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
    const record = await FeeRecord.findOne({ _id: req.params.id, teacherId: req.teacher._id }).populate("studentId");
    if (!record) return res.status(404).json({ message: "Fee record not found" });
    res.json({ record });
  } catch (error) {
    res.status(400).json({ message: "Could not fetch receipt", error: error.message });
  }
});

module.exports = router;
