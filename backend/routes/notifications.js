const express = require("express");
const NotificationLog = require("../models/NotificationLog");
const Student = require("../models/Student");
const protect = require("../middleware/protect");
const { currentMonth, MONTH_PATTERN } = require("../utils/month");
const { getReminderQueue } = require("../services/reminderService");
const { buildManualReminderMessage, normalizePhoneNumber } = require("../utils/reminders");

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  try {
    const query = { teacherId: req.teacher._id };
    if (req.query.month) query.month = req.query.month;

    const notifications = await NotificationLog.find(query)
      .populate("studentId", "name class parentName parentPhone")
      .sort({ sentAt: -1 })
      .limit(200);

    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch notifications", error: error.message });
  }
});

router.get("/reminder-queue", async (req, res) => {
  try {
    const month = req.query.month || currentMonth();
    if (!MONTH_PATTERN.test(month)) return res.status(400).json({ message: "Month must use YYYY-MM format" });

    const reminders = await getReminderQueue({ teacherId: req.teacher._id, month });
    res.json({ month, reminders });
  } catch (error) {
    res.status(500).json({ message: "Could not build reminder queue", error: error.message });
  }
});

router.post("/open/:studentId", async (req, res) => {
  try {
    const month = req.body.month || currentMonth();
    if (!MONTH_PATTERN.test(month)) return res.status(400).json({ message: "Month must use YYYY-MM format" });

    const student = await Student.findOne({ _id: req.params.studentId, teacherId: req.teacher._id });
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (!student.parentPhone) return res.status(400).json({ message: "Parent phone number is missing" });

    const recipientPhone = normalizePhoneNumber(student.parentPhone);
    const message = req.body.message || buildManualReminderMessage({
      student,
      month,
      dueDate: new Date(),
      amountDue: Number(req.body.amountDue || student.feeAmount),
      type: req.body.type || "manual",
    });

    const notification = await NotificationLog.create({
      teacherId: req.teacher._id,
      studentId: student._id,
      month,
      recipientPhone: `+${recipientPhone}`,
      message,
      status: "opened",
      channel: "whatsapp_manual",
      type: req.body.type || "manual",
    });

    res.json({
      message: "WhatsApp message prepared",
      notification,
      whatsappUrl: `https://wa.me/${recipientPhone}?text=${encodeURIComponent(message)}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Could not prepare WhatsApp reminder", error: error.message });
  }
});

router.patch("/:id/handled", async (req, res) => {
  try {
    const notification = await NotificationLog.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.teacher._id },
      { status: "handled" },
      { new: true }
    );

    if (!notification) return res.status(404).json({ message: "Notification log not found" });
    res.json({ message: "Reminder marked as handled", notification });
  } catch (error) {
    res.status(500).json({ message: "Could not update reminder", error: error.message });
  }
});

router.post("/send/:studentId", async (req, res) => {
  try {
    const month = req.body.month || currentMonth();
    if (!MONTH_PATTERN.test(month)) return res.status(400).json({ message: "Month must use YYYY-MM format" });

    const student = await Student.findOne({ _id: req.params.studentId, teacherId: req.teacher._id });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const recipientPhone = normalizePhoneNumber(student.parentPhone);
    if (!recipientPhone) return res.status(400).json({ message: "Parent phone number is missing" });

    const [year, monthNumber] = month.split("-").map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();
    const dueDate = new Date(year, monthNumber - 1, Math.min(student.feeDueDate, lastDay));
    const message = buildManualReminderMessage({
      student,
      month,
      dueDate,
      amountDue: Number(req.body.amountDue || student.feeAmount),
      type: req.body.type || "manual",
    });

    const notification = await NotificationLog.create({
      teacherId: req.teacher._id,
      studentId: student._id,
      month,
      recipientPhone: `+${recipientPhone}`,
      message,
      status: "opened",
      channel: "whatsapp_manual",
      type: req.body.type || "manual",
    });

    res.json({
      message: "WhatsApp message prepared",
      notification,
      whatsappUrl: `https://wa.me/${recipientPhone}?text=${encodeURIComponent(message)}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Could not prepare reminder", error: error.message });
  }
});

module.exports = router;
