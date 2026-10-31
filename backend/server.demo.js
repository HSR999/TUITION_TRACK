const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;
const { getIndiaDateKey, isValidDateKey, normalizePhone } = require("./utils/validation");

app.use(cors());
app.use(express.json());

const teacher = {
  _id: "demo-teacher",
  name: "Demo Teacher",
  email: "demo@tuitiontrack.com",
};

const now = new Date();
const currentMonth = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).format(new Date());
const today = () => getIndiaDateKey();
const makeId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const previousMonths = (count) => {
  const months = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
};

const normalizePhoneNumber = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
};

const buildDemoReminder = ({ student, month, amountDue, type }) => {
  if (type === "overdue") {
    return `Namaste ${student.parentName} ji, ${student.name} ki ${month} tuition fee ₹${amountDue} ab overdue hai. Kripya jaldi payment clear kar dein. - TuitionTrack`;
  }
  if (type === "partial") {
    return `Namaste ${student.parentName} ji, ${student.name} ki ${month} tuition fee me ₹${amountDue} balance pending hai. Kripya remaining amount clear kar dein. - TuitionTrack`;
  }
  return `Namaste ${student.parentName} ji, reminder: ${student.name} ki ${month} tuition fee ₹${amountDue} due hai. Kripya time par payment kar dein. - TuitionTrack`;
};

let students = [
  ["stu-1", "Aarav Sharma", "9876501001", "Rajesh Sharma", "9876509001", "9", 1800, 5],
  ["stu-2", "Anaya Gupta", "9876501002", "Meena Gupta", "9876509002", "9", 1800, 8],
  ["stu-3", "Kabir Singh", "9876501003", "Harpreet Singh", "9876509003", "9", 2000, 10],
  ["stu-4", "Meera Nair", "9876501004", "Sujatha Nair", "9876509004", "9", 1800, 12],
  ["stu-5", "Vivaan Verma", "9876501005", "Kavita Verma", "9876509005", "10", 2200, 5],
  ["stu-6", "Ishita Rao", "9876501006", "Prakash Rao", "9876509006", "10", 2200, 7],
  ["stu-7", "Reyansh Jain", "9876501007", "Nitin Jain", "9876509007", "10", 2400, 9],
  ["stu-8", "Sara Khan", "9876501008", "Imran Khan", "9876509008", "10", 2200, 14],
  ["stu-9", "Arjun Mehta", "9876501009", "Sanjay Mehta", "9876509009", "11", 3000, 5],
  ["stu-10", "Riya Malhotra", "9876501010", "Neha Malhotra", "9876509010", "11", 3200, 6],
  ["stu-11", "Dev Kapoor", "9876501011", "Amit Kapoor", "9876509011", "11", 3000, 11],
  ["stu-12", "Tara Bansal", "9876501012", "Pooja Bansal", "9876509012", "11", 3200, 15],
].map(([id, name, phone, parentName, parentPhone, className, feeAmount, feeDueDate], index) => ({
  _id: id,
  teacherId: teacher._id,
  name,
  phone,
  parentName,
  parentPhone,
  parentEmail: "",
  class: className,
  feeAmount,
  feeDueDate,
  address: `Demo address ${index + 1}, Delhi`,
  joinedAt: new Date(now.getFullYear(), 0, index + 1).toISOString(),
  isArchived: false,
}));

let fees = [];
let payments = [];
previousMonths(6).forEach((month, monthIndex) => {
  students.forEach((student, studentIndex) => {
    const isCurrent = month === currentMonth();
    const pattern = (studentIndex + monthIndex) % 5;
    let amountPaid = student.feeAmount;

    if (isCurrent && pattern === 0) amountPaid = 0;
    else if (isCurrent && pattern === 1) amountPaid = Math.round(student.feeAmount / 2);
    else if (!isCurrent && pattern === 0) amountPaid = student.feeAmount - 300;

    const status = amountPaid === 0 ? "due" : amountPaid >= student.feeAmount ? "paid" : "partial";
    fees.push({
      _id: `fee-${month}-${student._id}`,
      teacherId: teacher._id,
      studentId: student._id,
      month,
      amountPaid,
      amountDue: student.feeAmount,
      paidOn: amountPaid ? new Date(now.getFullYear(), now.getMonth(), Math.min(student.feeDueDate + 1, 26)).toISOString() : null,
      status,
      receiptNumber: amountPaid ? `TT-${month.replace("-", "")}-${String(studentIndex + 1).padStart(4, "0")}` : null,
    });
  });
});

let attendance = [];
for (let dayOffset = 0; dayOffset < 18; dayOffset += 1) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
  if (date.getDay() === 0) continue;
  students.forEach((student, index) => {
    attendance.push({
      _id: `att-${dayOffset}-${student._id}`,
      teacherId: teacher._id,
      studentId: student._id,
      date: date.toISOString().slice(0, 10),
      status: (index + dayOffset) % 7 === 0 ? "absent" : "present",
    });
  });
}

let expenses = [
  ["exp-1", "Classroom rent", 12000, "rent", 2],
  ["exp-2", "Whiteboard markers", 850, "supplies", 4],
  ["exp-3", "Internet bill", 999, "utilities", 6],
  ["exp-4", "Printed worksheets", 1450, "supplies", 9],
  ["exp-5", "Local travel", 1200, "travel", 13],
  ["exp-6", "Assistant payout", 5000, "salary", 18],
].map(([id, title, amount, category, day]) => ({
  _id: id,
  teacherId: teacher._id,
  title,
  amount,
  category,
  date: new Date(now.getFullYear(), now.getMonth(), Math.min(day, now.getDate())).toISOString(),
}));

let notifications = students.slice(0, 6).map((student, index) => ({
  _id: `not-${index + 1}`,
  teacherId: teacher._id,
  studentId: student,
  month: currentMonth(),
  recipientPhone: `+91${student.parentPhone}`,
  message: `TuitionTrack reminder sent to ${student.parentName}`,
  provider: "demo",
  providerMessageId: `demo-${index + 1}`,
  sentAt: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - index)).toISOString(),
  status: index === 5 ? "handled" : "opened",
  channel: "whatsapp_manual",
  type: index % 2 === 0 ? "upcoming_due" : "overdue",
  error: null,
}));

const requireDemoAuth = (req, res, next) => {
  if (!req.headers.authorization) return res.status(401).json({ message: "Not authorized" });
  next();
};

const getFeeRecord = (student, month) => {
  let record = fees.find((fee) => fee.studentId === student._id && fee.month === month);
  if (!record) {
    record = {
      _id: makeId("fee"),
      teacherId: teacher._id,
      studentId: student._id,
      month,
      amountPaid: 0,
      amountDue: student.feeAmount,
      status: "due",
      paidOn: null,
      receiptNumber: null,
    };
    fees.push(record);
  }
  return record;
};

const getLegacyPayment = (student, record) => ({
  _id: `legacy-${record._id}`,
  studentId: student._id,
  month: record.month,
  amount: record.amountPaid,
  amountPaid: record.amountPaid,
  paidAt: record.paidOn,
  paidOn: record.paidOn,
  receiptNumber: record.receiptNumber || `TT-LEGACY-${String(record._id).slice(-8).toUpperCase()}`,
  method: "other",
  status: record.status,
  isLegacy: true,
  note: "Imported from the existing monthly total; older payment breakdown is unavailable.",
});

const recordDemoPayment = (student, month, amount, method = "other", amountIsTotal = false) => {
  const record = getFeeRecord(student, month);
  const paymentAmount = amountIsTotal ? amount - Number(record.amountPaid || 0) : amount;
  if (paymentAmount < -0.001) throw new Error("Recorded payments cannot be reduced");
  if (paymentAmount <= 0.001) return { student, record, payment: null };
  if (!Number.isFinite(paymentAmount) || Math.round(paymentAmount * 100) / 100 !== paymentAmount) {
    throw new Error("Payment amount must have no more than two decimal places");
  }
  const roundedAmount = Math.round(paymentAmount * 100) / 100;
  const newTotal = Math.round((Number(record.amountPaid || 0) + roundedAmount) * 100) / 100;
  if (newTotal > student.feeAmount) throw new Error("Payment would exceed the monthly fee");

  if (!payments.some((payment) => payment.studentId === student._id && payment.month === month) && record.amountPaid > 0) {
    payments.push(getLegacyPayment(student, record));
  }

  const status = newTotal >= student.feeAmount ? "paid" : "partial";
  const paidAt = new Date().toISOString();
  const payment = {
    _id: makeId("payment"),
    studentId: student._id,
    month,
    amount: roundedAmount,
    amountPaid: roundedAmount,
    paidAt,
    paidOn: paidAt,
    receiptNumber: `TT-${month.replace("-", "")}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    method,
    status,
    isLegacy: false,
  };
  payments.unshift(payment);
  Object.assign(record, {
    amountPaid: newTotal,
    amountDue: student.feeAmount,
    status,
    paidOn: paidAt,
    receiptNumber: payment.receiptNumber,
  });
  return { student, record, payment };
};

app.get("/", (req, res) => res.json({ message: "TuitionTrack Demo API is running" }));
app.get("/api/health", (req, res) => res.json({ status: "ok", mode: "demo" }));

app.post("/api/auth/login", (req, res) => {
  if (req.body.email !== "demo@tuitiontrack.com" || req.body.password !== "Demo@12345") {
    return res.status(401).json({ message: "Use demo@tuitiontrack.com / Demo@12345" });
  }
  res.json({ token: "demo-token", teacher });
});
app.post("/api/auth/register", (req, res) => res.status(201).json({ message: "Demo mode uses the demo account", teacher }));
app.get("/api/auth/me", requireDemoAuth, (req, res) => res.json({ teacher }));

app.get("/api/students", requireDemoAuth, (req, res) => {
  const search = String(req.query.search || "").toLowerCase();
  const filtered = students.filter((student) => (
    (req.query.includeArchived === "true" || !student.isArchived)
    && (!req.query.class || student.class === req.query.class)
    && (!search || [student.name, student.phone, student.parentName, student.parentPhone].some((value) => value.toLowerCase().includes(search)))
  ));
  res.json({ students: filtered.sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name)) });
});

app.post("/api/students", requireDemoAuth, (req, res) => {
  if (!req.body.name || !req.body.parentName || !req.body.parentPhone || !req.body.class
    || !Number.isFinite(Number(req.body.feeAmount)) || Number(req.body.feeAmount) < 0
    || !Number.isInteger(Number(req.body.feeDueDate)) || Number(req.body.feeDueDate) < 1 || Number(req.body.feeDueDate) > 31) {
    return res.status(400).json({ message: "Student name, parent name and phone, class, fee, and due day are required" });
  }
  let student;
  try {
    student = {
      ...req.body,
      phone: normalizePhone(req.body.phone),
      parentPhone: normalizePhone(req.body.parentPhone),
      _id: makeId("stu"),
      teacherId: teacher._id,
      joinedAt: new Date().toISOString(),
      isArchived: false,
    };
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  students.push(student);
  res.status(201).json({ message: "Student added", student });
});

app.put("/api/students/:id", requireDemoAuth, (req, res) => {
  const student = students.find((item) => item._id === req.params.id && !item.isArchived);
  if (!student) return res.status(404).json({ message: "Student not found" });
  const editableFields = ["name", "phone", "parentName", "parentPhone", "parentEmail", "class", "feeAmount", "feeDueDate", "address", "joinedAt"];
  const updates = Object.fromEntries(editableFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
  if (updates.name !== undefined && (typeof updates.name !== "string" || updates.name.trim().length < 2 || updates.name.trim().length > 100)) {
    return res.status(400).json({ message: "Student name must be between 2 and 100 characters" });
  }
  if (updates.parentPhone !== undefined && !updates.parentPhone) return res.status(400).json({ message: "Parent phone is required" });
  try {
    if (updates.phone !== undefined) updates.phone = normalizePhone(updates.phone);
    if (updates.parentPhone !== undefined) updates.parentPhone = normalizePhone(updates.parentPhone);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  Object.assign(student, updates);
  return res.json({ message: "Student updated", student });
});

const updateArchiveStatus = (req, res, isArchived) => {
  const student = students.find((item) => item._id === req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  student.isArchived = isArchived;
  student.archivedAt = isArchived ? new Date().toISOString() : null;
  return res.json({ message: isArchived ? "Student archived" : "Student restored", student });
};

app.patch("/api/students/:id/archive", requireDemoAuth, (req, res) => updateArchiveStatus(req, res, true));
app.patch("/api/students/:id/restore", requireDemoAuth, (req, res) => updateArchiveStatus(req, res, false));
app.delete("/api/students/:id", requireDemoAuth, (req, res) => updateArchiveStatus(req, res, true));

app.get("/api/fees/transactions", requireDemoAuth, (req, res) => {
  const month = req.query.month || currentMonth();
  const transactions = payments
    .filter((payment) => payment.month === month)
    .map((record) => ({ student: students.find((student) => student._id === record.studentId), record }))
    .filter((item) => item.student);
  fees.filter((record) => record.month === month && record.amountPaid > 0
    && !payments.some((payment) => payment.studentId === record.studentId && payment.month === month))
    .forEach((record) => {
      const student = students.find((item) => item._id === record.studentId);
      if (student) transactions.push({ student, record: getLegacyPayment(student, record) });
    });
  transactions.sort((left, right) => new Date(right.record.paidOn || 0) - new Date(left.record.paidOn || 0));
  res.json({ month, transactions });
});

app.get("/api/fees", requireDemoAuth, (req, res) => {
  const month = req.query.month || currentMonth();
  const filteredStudents = students.filter((student) => !student.isArchived && (!req.query.class || student.class === req.query.class));
  const feeRows = filteredStudents.map((student) => ({
    student,
    record: fees.find((fee) => fee.studentId === student._id && fee.month === month) || {
      _id: `temp-${student._id}-${month}`,
      studentId: student._id,
      month,
      amountPaid: 0,
      amountDue: student.feeAmount,
      status: "due",
      paidOn: null,
      receiptNumber: null,
    },
    payments: (() => {
      const history = payments.filter((payment) => payment.studentId === student._id && payment.month === month);
      if (history.length) return history;
      const existing = fees.find((fee) => fee.studentId === student._id && fee.month === month);
      return existing?.amountPaid > 0 ? [getLegacyPayment(student, existing)] : [];
    })(),
  }));
  res.json({ month, fees: feeRows });
});

app.post("/api/fees/:studentId/:month/payments", requireDemoAuth, (req, res) => {
  const { month } = req.params;
  const amount = Number(req.body.amount);
  const method = req.body.method || "other";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return res.status(400).json({ message: "Month must use YYYY-MM format" });
  if (!Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7) {
    return res.status(400).json({ message: "Payment amount must be positive and have no more than two decimal places" });
  }
  if (!["cash", "upi", "bank_transfer", "other"].includes(method)) return res.status(400).json({ message: "Payment method is not supported" });
  const student = students.find((item) => item._id === req.params.studentId);
  if (!student || student.isArchived) return res.status(404).json({ message: "Student not found" });
  try {
    const result = recordDemoPayment(student, month, amount, method);
    return res.status(201).json({ message: "Payment recorded", ...result });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.put("/api/fees/:studentId/:month", requireDemoAuth, (req, res) => {
  const month = req.params.month;
  const amountPaid = Number(req.body.amountPaid);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return res.status(400).json({ message: "Month must use YYYY-MM format" });
  if (!Number.isFinite(amountPaid) || amountPaid < 0 || Math.abs(amountPaid * 100 - Math.round(amountPaid * 100)) > 1e-7) {
    return res.status(400).json({ message: "amountPaid must be a non-negative amount with no more than two decimal places" });
  }
  const student = students.find((item) => item._id === req.params.studentId && !item.isArchived);
  if (!student) return res.status(404).json({ message: "Student not found" });
  try {
    const result = recordDemoPayment(student, month, amountPaid, "other", true);
    return res.json({ message: result.payment ? "Payment recorded" : "Fee total unchanged", ...result });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get("/api/attendance", requireDemoAuth, (req, res) => {
  const date = req.query.date || today();
  if (!isValidDateKey(date)) return res.status(400).json({ message: "Date must be a real date in YYYY-MM-DD format" });
  const filteredStudents = students.filter((student) => !student.isArchived && (!req.query.class || student.class === req.query.class));
  res.json({
    date,
    attendance: filteredStudents.map((student) => ({
      student,
      record: attendance.find((item) => item.studentId === student._id && item.date === date) || null,
    })),
  });
});

app.put("/api/attendance/mark", requireDemoAuth, (req, res) => {
  if (!isValidDateKey(req.body.date)) return res.status(400).json({ message: "A real date in YYYY-MM-DD format is required" });
  if (req.body.date < today()) return res.status(403).json({ message: "Past attendance is read-only" });
  if (!Array.isArray(req.body.records) || req.body.records.length === 0
    || req.body.records.some((record) => !["present", "absent"].includes(record.status))) {
    return res.status(400).json({ message: "A non-empty records array and valid attendance status are required" });
  }
  if (new Set(req.body.records.map((record) => record.studentId)).size !== req.body.records.length) {
    return res.status(400).json({ message: "Attendance records cannot include duplicate students" });
  }
  if (req.body.records.some((record) => !students.some((student) => student._id === record.studentId && !student.isArchived))) {
    return res.status(403).json({ message: "One or more students are invalid" });
  }
  req.body.records.forEach((record) => {
    attendance = attendance.filter((item) => !(item.studentId === record.studentId && item.date === req.body.date));
    attendance.push({ _id: makeId("att"), teacherId: teacher._id, studentId: record.studentId, date: req.body.date, status: record.status });
  });
  res.json({ message: "Attendance saved" });
});

app.get("/api/expenses", requireDemoAuth, (req, res) => {
  const month = req.query.month || currentMonth();
  res.json({ expenses: expenses.filter((expense) => expense.date.startsWith(month)) });
});

app.post("/api/expenses", requireDemoAuth, (req, res) => {
  const expense = { ...req.body, _id: makeId("exp"), teacherId: teacher._id };
  expenses.push(expense);
  res.status(201).json({ message: "Expense added", expense });
});

app.put("/api/expenses/:id", requireDemoAuth, (req, res) => {
  expenses = expenses.map((expense) => expense._id === req.params.id ? { ...expense, ...req.body } : expense);
  res.json({ message: "Expense updated", expense: expenses.find((expense) => expense._id === req.params.id) });
});

app.delete("/api/expenses/:id", requireDemoAuth, (req, res) => {
  expenses = expenses.filter((expense) => expense._id !== req.params.id);
  res.json({ message: "Expense deleted" });
});

app.get("/api/notifications", requireDemoAuth, (req, res) => {
  const month = req.query.month || currentMonth();
  res.json({
    notifications: notifications
      .filter((item) => item.month === month)
      .sort((left, right) => new Date(right.sentAt) - new Date(left.sentAt)),
  });
});

app.get("/api/notifications/push/status", requireDemoAuth, (req, res) => {
  res.json({ available: false, subscriptionEndpoints: [], publicKey: null });
});
app.post("/api/notifications/push/subscribe", requireDemoAuth, (req, res) => {
  res.status(503).json({ message: "Phone push notifications require the production backend and VAPID configuration" });
});
app.delete("/api/notifications/push/subscribe", requireDemoAuth, (req, res) => {
  res.status(503).json({ message: "Phone push notifications require the production backend and VAPID configuration" });
});

app.get("/api/notifications/reminder-queue", requireDemoAuth, (req, res) => {
  const month = req.query.month || currentMonth();
  const [year, monthNumber] = month.split("-").map(Number);
  const monthLength = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const todayKey = today();
  const currentFees = fees.filter((fee) => fee.month === month);
  const feeByStudent = new Map(currentFees.map((fee) => [fee.studentId, fee]));
  const latestStatusByStudent = new Map();
  notifications
    .filter((notification) => notification.month === month && notification.channel === "whatsapp_manual")
    .forEach((notification) => {
      const studentId = typeof notification.studentId === "string" ? notification.studentId : notification.studentId?._id;
      if (studentId && !latestStatusByStudent.has(studentId)) latestStatusByStudent.set(studentId, notification.status);
    });
  const handledStudents = new Set([...latestStatusByStudent]
    .filter(([, status]) => status === "handled")
    .map(([studentId]) => studentId));
  const reminders = students.filter((student) => !student.isArchived)
    .map((student) => {
      const record = feeByStudent.get(student._id);
      const amountPaid = Number(record?.amountPaid || 0);
      const amountDue = Math.max(student.feeAmount - amountPaid, 0);
      if (amountDue <= 0 || record?.status === "paid") return null;
      const dueDay = Math.min(student.feeDueDate, monthLength);
      const dueDateKey = `${month}-${String(dueDay).padStart(2, "0")}`;
      const daysUntilDue = Math.round((Date.parse(`${dueDateKey}T00:00:00Z`) - Date.parse(`${todayKey}T00:00:00Z`)) / 86400000);
      const type = record?.status === "partial" ? "partial" : daysUntilDue < 0 ? "overdue" : daysUntilDue <= 3 ? "upcoming_due" : null;
      if (!type || handledStudents.has(student._id)) return null;
      return {
        studentId: student._id,
        studentName: student.name,
        class: student.class,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        whatsappNumber: normalizePhoneNumber(student.parentPhone),
        month,
        feeAmount: student.feeAmount,
        amountPaid,
        amountDue,
        type,
        dueDate: new Date(`${dueDateKey}T00:00:00.000Z`).toISOString(),
        daysUntilDue,
        message: buildDemoReminder({ student, month, amountDue, type }),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.studentName.localeCompare(right.studentName));
  res.json({ month, reminders });
});

app.post("/api/notifications/open/:studentId", requireDemoAuth, (req, res) => {
  const student = students.find((item) => item._id === req.params.studentId && !item.isArchived);
  if (!student) return res.status(404).json({ message: "Student not found" });
  const number = normalizePhoneNumber(student.parentPhone);
  const message = req.body.message || buildDemoReminder({
    student,
    month: req.body.month || currentMonth(),
    amountDue: req.body.amountDue || student.feeAmount,
    type: req.body.type || "manual",
  });
  const notification = {
    _id: makeId("not"),
    teacherId: teacher._id,
    studentId: student,
    month: req.body.month || currentMonth(),
    recipientPhone: `+${number}`,
    message,
    provider: "whatsapp_deeplink",
    sentAt: new Date().toISOString(),
    status: "opened",
    channel: "whatsapp_manual",
    type: req.body.type || "manual",
  };
  notifications.unshift(notification);
  res.json({ message: "WhatsApp message prepared", notification, whatsappUrl: `https://wa.me/${number}?text=${encodeURIComponent(message)}` });
});

app.patch("/api/notifications/:id/handled", requireDemoAuth, (req, res) => {
  notifications = notifications.map((notification) => (
    notification._id === req.params.id ? { ...notification, status: "handled" } : notification
  ));
  res.json({ message: "Reminder marked as handled", notification: notifications.find((item) => item._id === req.params.id) });
});

app.post("/api/notifications/send/:studentId", requireDemoAuth, (req, res) => {
  const student = students.find((item) => item._id === req.params.studentId && !item.isArchived);
  if (!student) return res.status(404).json({ message: "Student not found" });
  const number = normalizePhoneNumber(student.parentPhone);
  const message = buildDemoReminder({
    student,
    month: req.body.month || currentMonth(),
    amountDue: req.body.amountDue || student.feeAmount,
    type: req.body.type || "manual",
  });
  const notification = {
    _id: makeId("not"),
    teacherId: teacher._id,
    studentId: student,
    month: req.body.month || currentMonth(),
    recipientPhone: `+${number}`,
    message,
    provider: "whatsapp_deeplink",
    sentAt: new Date().toISOString(),
    status: "opened",
    channel: "whatsapp_manual",
    type: req.body.type || "manual",
  };
  notifications.unshift(notification);
  res.json({ message: "WhatsApp message prepared", notification, whatsappUrl: `https://wa.me/${number}?text=${encodeURIComponent(message)}` });
});

app.get("/api/dashboard", requireDemoAuth, (req, res) => {
  const month = currentMonth();
  const currentFees = fees.filter((fee) => fee.month === month);
  const monthlyRevenue = currentFees.reduce((sum, fee) => sum + fee.amountPaid, 0);
  const activeStudents = students.filter((student) => !student.isArchived);
  const activeIds = new Set(activeStudents.map((student) => student._id));
  const monthlyExpenses = expenses.filter((expense) => expense.date.startsWith(month)).reduce((sum, expense) => sum + expense.amount, 0);
  const currentAttendance = attendance.filter((item) => item.date.startsWith(month) && activeIds.has(item.studentId));
  const presentCount = currentAttendance.filter((item) => item.status === "present").length;
  const avgAttendance = currentAttendance.length ? Math.round((presentCount / currentAttendance.length) * 100) : 0;
  const feeByStudent = new Map(currentFees.map((fee) => [fee.studentId, fee]));
  const feeCollection = activeStudents.reduce((result, student) => {
    const fee = feeByStudent.get(student._id);
    result[fee?.status || "due"] += 1;
    return result;
  }, { paid: 0, partial: 0, due: 0 });
  const feeDueDays = [...new Set(activeStudents
    .filter((student) => feeByStudent.get(student._id)?.status !== "paid")
    .map((student) => Math.min(student.feeDueDate, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()))
  )].sort((a, b) => a - b);
  const chartMonths = previousMonths(6);

  res.json({
    month,
    dueDays: feeDueDays,
    stats: {
      totalStudents: activeStudents.length,
      monthlyRevenue,
      pendingFees: activeStudents.reduce((sum, student) => {
        const fee = feeByStudent.get(student._id);
        return sum + Math.max(student.feeAmount - Number(fee?.amountPaid || 0), 0);
      }, 0),
      avgAttendance,
      monthlyExpenses,
      netProfit: monthlyRevenue - monthlyExpenses,
    },
    feeCollection,
    revenueChart: chartMonths.map((item) => ({
      month: item,
      revenue: fees.filter((fee) => fee.month === item).reduce((sum, fee) => sum + fee.amountPaid, 0),
    })),
  });
});

app.use((req, res) => res.status(404).json({ message: "Demo route not found" }));

app.listen(PORT, () => {
  console.log(`TuitionTrack demo API running on port ${PORT}`);
  console.log("Demo login: demo@tuitiontrack.com / Demo@12345");
});
