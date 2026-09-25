const Student = require("../models/Student");
const FeeRecord = require("../models/FeeRecord");
const { buildManualReminderMessage, normalizePhoneNumber } = require("../utils/reminders");
const { withDataScope } = require("../utils/access");

const UPCOMING_REMINDER_DAYS = Number(process.env.UPCOMING_REMINDER_DAYS || 3);

const getIndiaToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const mapped = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  return new Date(mapped.year, mapped.month - 1, mapped.day);
};

const getEffectiveDueDate = ({ month, feeDueDate }) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return new Date(year, monthNumber - 1, Math.min(feeDueDate, lastDay));
};

const daysBetween = (startDate, endDate) => {
  const start = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
};

const getReminderQueue = async ({ req, teacherId, month }) => {
  const today = getIndiaToday();
  const scope = req ? withDataScope(req) : { teacherId };
  const students = await Student.find(req ? withDataScope(req, { parentPhone: { $ne: "" } }) : { teacherId, parentPhone: { $ne: "" } }).sort({ class: 1, name: 1 }).lean();
  const feeRecords = await FeeRecord.find(req ? withDataScope(req, { month }) : { teacherId, month }).lean();
  const feeByStudent = new Map(feeRecords.map((record) => [record.studentId.toString(), record]));

  return students
    .map((student) => {
      const record = feeByStudent.get(student._id.toString());
      const amountPaid = Number(record?.amountPaid || 0);
      const amountDue = Math.max(Number(student.feeAmount || 0) - amountPaid, 0);
      if (amountDue <= 0 || record?.status === "paid") return null;

      const dueDate = getEffectiveDueDate({ month, feeDueDate: student.feeDueDate });
      const daysUntilDue = daysBetween(today, dueDate);
      let type = null;

      if (record?.status === "partial") type = "partial";
      else if (daysUntilDue < 0) type = "overdue";
      else if (daysUntilDue <= UPCOMING_REMINDER_DAYS) type = "upcoming_due";

      if (!type) return null;

      const message = buildManualReminderMessage({ student, month, dueDate, amountDue, type });
      const whatsappNumber = normalizePhoneNumber(student.parentPhone);

      return {
        studentId: student._id,
        studentName: student.name,
        class: student.class,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        whatsappNumber,
        month,
        feeAmount: student.feeAmount,
        amountPaid,
        amountDue,
        type,
        dueDate,
        daysUntilDue,
        message,
      };
    })
    .filter(Boolean);
};

const runDueReminderJob = async () => {
  console.log("Manual reminder mode active: reminders are shown in the app queue, not sent automatically.");
};

module.exports = {
  getReminderQueue,
  runDueReminderJob,
};
