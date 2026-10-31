const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const FeeRecord = require("../models/FeeRecord");
const FeePayment = require("../models/FeePayment");
const protect = require("../middleware/protect");
const { MONTH_PATTERN, currentMonth } = require("../utils/month");
const { getCreateOwnership, withDataScope } = require("../utils/access");

const router = express.Router();
router.use(protect);

const getStatus = (amountPaid, feeAmount) => (
  amountPaid <= 0 ? "due" : amountPaid >= feeAmount ? "paid" : "partial"
);

const makeReceiptNumber = (month) => (
  `TT-${month.replace("-", "")}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
);

const getPaymentErrorStatus = (error) => (
  error.status
  || (error.name === "ValidationError" || error.name === "CastError" ? 400 : error.code === 11000 ? 409 : 500)
);

const makeLegacyPayment = (student, record) => ({
  _id: `legacy-${record._id}`,
  amount: record.amountPaid,
  amountPaid: record.amountPaid,
  month: record.month,
  paidAt: record.paidOn || record.updatedAt || record.createdAt || null,
  paidOn: record.paidOn || record.updatedAt || record.createdAt || null,
  receiptNumber: record.receiptNumber || `TT-LEGACY-${String(record._id).slice(-8).toUpperCase()}`,
  method: "other",
  note: "Imported from the existing monthly total; older payment breakdown is unavailable.",
  statusAfterPayment: record.status === "due" ? "partial" : record.status,
  status: record.status,
  isLegacy: true,
});

const recordPayment = async ({ req, studentId, month, amount, method, note, amountIsTotal = false }) => {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const student = await Student.findOne(withDataScope(req, {
        _id: studentId,
        isArchived: { $ne: true },
      })).session(session);
      if (!student) {
        const error = new Error("Student not found");
        error.status = 404;
        throw error;
      }

      const ownership = getCreateOwnership(req, student.teacherId || req.teacher._id);
      let feeRecord = await FeeRecord.findOne(withDataScope(req, { studentId, month })).session(session);
      if (!feeRecord) {
        [feeRecord] = await FeeRecord.create([{
          ...ownership,
          studentId,
          month,
          amountPaid: 0,
          amountDue: student.feeAmount,
          status: "due",
        }], { session });
      }

      const currentTotal = Number(feeRecord.amountPaid || 0);
      const paymentAmount = amountIsTotal ? amount - currentTotal : amount;
      if (amountIsTotal && paymentAmount < -0.001) {
        const error = new Error("Recorded payments cannot be reduced");
        error.status = 400;
        throw error;
      }

      if (paymentAmount <= 0.001) {
        result = { student, record: feeRecord, payment: null };
        return;
      }

      const roundedAmount = Math.round(paymentAmount * 100) / 100;
      const newTotal = Math.round((currentTotal + roundedAmount) * 100) / 100;
      if (newTotal > student.feeAmount) {
        const error = new Error("Payment would exceed the monthly fee");
        error.status = 400;
        throw error;
      }

      const existingPaymentCount = await FeePayment.countDocuments({ studentId, month }).session(session);
      if (existingPaymentCount === 0 && currentTotal > 0) {
        const legacyReceiptNumber = feeRecord.receiptNumber || makeLegacyPayment(student, feeRecord).receiptNumber;
        await FeePayment.create([{
          ...ownership,
          studentId,
          month,
          amount: currentTotal,
          paidAt: feeRecord.paidOn || feeRecord.updatedAt || feeRecord.createdAt || new Date(),
          receiptNumber: legacyReceiptNumber,
          statusAfterPayment: getStatus(currentTotal, student.feeAmount) === "due" ? "partial" : getStatus(currentTotal, student.feeAmount),
          isLegacy: true,
          note: "Imported from the existing monthly total; older payment breakdown is unavailable.",
        }], { session });
      }

      const status = getStatus(newTotal, student.feeAmount);
      const paidAt = new Date();
      const receiptNumber = makeReceiptNumber(month);
      const [payment] = await FeePayment.create([{
        ...ownership,
        studentId,
        month,
        amount: roundedAmount,
        paidAt,
        receiptNumber,
        method,
        note,
        statusAfterPayment: status === "due" ? "partial" : status,
      }], { session });

      feeRecord.amountPaid = newTotal;
      feeRecord.amountDue = student.feeAmount;
      feeRecord.status = status;
      feeRecord.paidOn = paidAt;
      feeRecord.receiptNumber = receiptNumber;
      await feeRecord.save({ session });

      result = {
        student,
        record: feeRecord,
        payment: {
          ...payment.toObject(),
          amountPaid: payment.amount,
          paidOn: payment.paidAt,
          status: payment.statusAfterPayment,
        },
      };
    });
  } finally {
    await session.endSession();
  }

  return result;
};

const getPaymentLists = async (studentIds, month, req) => {
  const payments = studentIds.length
    ? await FeePayment.find(withDataScope(req, { month, studentId: { $in: studentIds } }))
      .sort({ paidAt: -1 })
      .lean()
    : [];
  const byStudent = new Map();
  payments.forEach((payment) => {
    const key = payment.studentId.toString();
    if (!byStudent.has(key)) byStudent.set(key, []);
    byStudent.get(key).push({
      ...payment,
      amountPaid: payment.amount,
      paidOn: payment.paidAt,
      status: payment.statusAfterPayment,
    });
  });
  return byStudent;
};

router.get("/", async (req, res) => {
  try {
    const month = req.query.month || currentMonth();
    if (!MONTH_PATTERN.test(month)) return res.status(400).json({ message: "Month must use YYYY-MM format" });

    const studentFilters = { isArchived: { $ne: true } };
    if (req.query.class) studentFilters.class = req.query.class;
    const students = await Student.find(withDataScope(req, studentFilters)).sort({ class: 1, name: 1 }).lean();
    const studentIds = students.map((student) => student._id);
    const records = studentIds.length
      ? await FeeRecord.find(withDataScope(req, { month, studentId: { $in: studentIds } })).lean()
      : [];
    const paymentsByStudent = await getPaymentLists(studentIds, month, req);
    const recordByStudent = new Map(records.map((record) => [record.studentId.toString(), record]));

    const fees = students.map((student) => {
      const record = recordByStudent.get(student._id.toString()) || {
        studentId: student._id,
        month,
        amountPaid: 0,
        amountDue: student.feeAmount,
        status: "due",
        paidOn: null,
        receiptNumber: null,
      };
      const payments = paymentsByStudent.get(student._id.toString()) || [];
      if (!payments.length && record.amountPaid > 0) payments.push(makeLegacyPayment(student, record));
      return { student, record, payments };
    });
    res.json({ month, fees });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch fees", error: error.message });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const month = req.query.month || currentMonth();
    if (!MONTH_PATTERN.test(month)) return res.status(400).json({ message: "Month must use YYYY-MM format" });

    const [payments, feeRecords] = await Promise.all([
      FeePayment.find(withDataScope(req, { month })).populate("studentId").sort({ paidAt: -1 }).lean(),
      FeeRecord.find(withDataScope(req, { month })).populate("studentId").lean(),
    ]);
    const transactions = payments.filter((payment) => payment.studentId).map((payment) => ({
      student: payment.studentId,
      record: {
        ...payment,
        studentId: payment.studentId._id,
        amountPaid: payment.amount,
        paidOn: payment.paidAt,
        status: payment.statusAfterPayment,
      },
    }));
    const studentsWithPayments = new Set(payments.map((payment) => payment.studentId?._id?.toString()));

    feeRecords.forEach((record) => {
      const studentId = record.studentId?._id?.toString();
      if (studentId && record.amountPaid > 0 && !studentsWithPayments.has(studentId)) {
        transactions.push({ student: record.studentId, record: makeLegacyPayment(record.studentId, record) });
      }
    });
    transactions.sort((left, right) => new Date(right.record.paidOn || 0) - new Date(left.record.paidOn || 0));
    res.json({ month, transactions });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch payment history", error: error.message });
  }
});

router.post("/:studentId/:month/payments", async (req, res) => {
  try {
    const { studentId, month } = req.params;
    const amount = Number(req.body.amount);
    const method = req.body.method || "other";
    const note = String(req.body.note || "").trim();
    if (!MONTH_PATTERN.test(month)) return res.status(400).json({ message: "Month must use YYYY-MM format" });
    if (!Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7) {
      return res.status(400).json({ message: "Payment amount must be positive and have no more than two decimal places" });
    }
    if (!["cash", "upi", "bank_transfer", "other"].includes(method)) {
      return res.status(400).json({ message: "Payment method is not supported" });
    }
    if (note.length > 250) return res.status(400).json({ message: "Payment note cannot exceed 250 characters" });

    const result = await recordPayment({ req, studentId, month, amount, method, note });
    res.status(201).json({ message: "Payment recorded", ...result });
  } catch (error) {
    res.status(getPaymentErrorStatus(error)).json({ message: error.message || "Could not record payment" });
  }
});

router.put("/:studentId/:month", async (req, res) => {
  try {
    const { studentId, month } = req.params;
    const amountPaid = Number(req.body.amountPaid);
    if (!MONTH_PATTERN.test(month)) return res.status(400).json({ message: "Month must use YYYY-MM format" });
    if (!Number.isFinite(amountPaid) || amountPaid < 0 || Math.abs(amountPaid * 100 - Math.round(amountPaid * 100)) > 1e-7) {
      return res.status(400).json({ message: "amountPaid must be a non-negative amount with no more than two decimal places" });
    }

    const result = await recordPayment({ req, studentId, month, amount: amountPaid, amountIsTotal: true, method: "other", note: "" });
    res.json({
      message: result.payment ? "Payment recorded" : "Fee total unchanged",
      record: result.record,
      student: result.student,
      payment: result.payment,
    });
  } catch (error) {
    res.status(getPaymentErrorStatus(error)).json({ message: error.message || "Could not update fee" });
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
