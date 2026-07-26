const express = require("express");
const Student = require("../models/Student");
const FeeRecord = require("../models/FeeRecord");
const Attendance = require("../models/Attendance");
const Expense = require("../models/Expense");
const protect = require("../middleware/protect");
const { currentMonth, monthRange } = require("../utils/month");

const router = express.Router();
router.use(protect);

const previousMonths = (count) => {
  const result = [];
  const now = new Date();
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    result.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }
  return result;
};

router.get("/", async (req, res) => {
  try {
    const teacherId = req.teacher._id;
    const month = currentMonth();
    const { start, end } = monthRange(month);
    const chartMonths = previousMonths(6);
    const nextMonthString = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-01`;

    const [students, currentFees, currentExpenses, attendanceRecords, revenueGroups] = await Promise.all([
      Student.find({ teacherId }).select("feeAmount").lean(),
      FeeRecord.find({ teacherId, month }).lean(),
      Expense.find({ teacherId, date: { $gte: start, $lt: end } }).lean(),
      Attendance.find({ teacherId, date: { $gte: `${month}-01`, $lt: nextMonthString } }).lean(),
      FeeRecord.aggregate([
        { $match: { teacherId, month: { $in: chartMonths } } },
        { $group: { _id: "$month", revenue: { $sum: "$amountPaid" } } },
      ]),
    ]);

    const feeByStudent = new Map(currentFees.map((fee) => [fee.studentId.toString(), fee]));
    const expectedRevenue = students.reduce((sum, student) => sum + student.feeAmount, 0);
    const monthlyRevenue = currentFees.reduce((sum, fee) => sum + fee.amountPaid, 0);
    const pendingFees = Math.max(expectedRevenue - monthlyRevenue, 0);
    const monthlyExpenses = currentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const presentCount = attendanceRecords.filter((record) => record.status === "present").length;
    const avgAttendance = attendanceRecords.length ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;

    const feeCollection = students.reduce(
      (result, student) => {
        const fee = feeByStudent.get(student._id.toString());
        result[fee?.status || "due"] += 1;
        return result;
      },
      { paid: 0, partial: 0, due: 0 }
    );
    const revenueByMonth = new Map(revenueGroups.map((item) => [item._id, item.revenue]));

    res.json({
      month,
      stats: {
        totalStudents: students.length,
        monthlyRevenue,
        pendingFees,
        avgAttendance,
        monthlyExpenses,
        netProfit: monthlyRevenue - monthlyExpenses,
      },
      feeCollection,
      revenueChart: chartMonths.map((item) => ({ month: item, revenue: revenueByMonth.get(item) || 0 })),
    });
  } catch (error) {
    res.status(500).json({ message: "Could not load dashboard", error: error.message });
  }
});

module.exports = router;
