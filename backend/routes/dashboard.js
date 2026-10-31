const express = require("express");
const Student = require("../models/Student");
const FeeRecord = require("../models/FeeRecord");
const Attendance = require("../models/Attendance");
const Expense = require("../models/Expense");
const protect = require("../middleware/protect");
const { currentMonth, monthRange } = require("../utils/month");
const { withDataScope } = require("../utils/access");

const router = express.Router();
router.use(protect);

const previousMonths = (count) => {
  const result = [];
  const [year, month] = currentMonth().split("-").map(Number);
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(year, month - 1 - offset, 1));
    result.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return result;
};

router.get("/", async (req, res) => {
  try {
    const month = currentMonth();
    const { start, end } = monthRange(month);
    const chartMonths = previousMonths(6);
    const nextMonthString = end.toISOString().slice(0, 10);

    const students = await Student.find(withDataScope(req, { isArchived: { $ne: true } }))
      .select("feeAmount feeDueDate")
      .lean();
    const [currentFees, currentExpenses, attendanceRecords, revenueGroups] = await Promise.all([
      FeeRecord.find(withDataScope(req, { month })).lean(),
      Expense.find(withDataScope(req, { date: { $gte: start, $lt: end } })).lean(),
      Attendance.find(withDataScope(req, {
        date: { $gte: `${month}-01`, $lt: nextMonthString },
        studentId: { $in: students.map((student) => student._id) },
      })).lean(),
      FeeRecord.aggregate([
        { $match: withDataScope(req, { month: { $in: chartMonths } }) },
        { $group: { _id: "$month", revenue: { $sum: "$amountPaid" } } },
      ]),
    ]);

    const feeByStudent = new Map(currentFees.map((fee) => [fee.studentId.toString(), fee]));
    const monthlyRevenue = currentFees.reduce((sum, fee) => sum + fee.amountPaid, 0);
    const pendingFees = students.reduce((sum, student) => {
      const fee = feeByStudent.get(student._id.toString());
      return sum + Math.max(student.feeAmount - Number(fee?.amountPaid || 0), 0);
    }, 0);
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
    const monthLength = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).getUTCDate();
    const dueDays = [...new Set(students
      .filter((student) => feeByStudent.get(student._id.toString())?.status !== "paid")
      .map((student) => Math.min(student.feeDueDate, monthLength))
    )].sort((a, b) => a - b);

    res.json({
      month,
      dueDays,
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
