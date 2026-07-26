const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const teacher = {
  _id: "demo-teacher",
  name: "Demo Teacher",
  email: "demo@tuitiontrack.com",
};

const now = new Date();
const currentMonth = () => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const today = () => new Date().toISOString().slice(0, 10);
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
}));

let fees = [];
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
    (!req.query.class || student.class === req.query.class)
    && (!search || [student.name, student.phone, student.parentName, student.parentPhone].some((value) => value.toLowerCase().includes(search)))
  ));
  res.json({ students: filtered.sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name)) });
});

app.post("/api/students", requireDemoAuth, (req, res) => {
  const student = { ...req.body, _id: makeId("stu"), teacherId: teacher._id, joinedAt: new Date().toISOString() };
  students.push(student);
  res.status(201).json({ message: "Student added", student });
});

app.put("/api/students/:id", requireDemoAuth, (req, res) => {
  students = students.map((student) => student._id === req.params.id ? { ...student, ...req.body } : student);
  res.json({ message: "Student updated", student: students.find((student) => student._id === req.params.id) });
});

app.delete("/api/students/:id", requireDemoAuth, (req, res) => {
  students = students.filter((student) => student._id !== req.params.id);
  fees = fees.filter((fee) => fee.studentId !== req.params.id);
  attendance = attendance.filter((item) => item.studentId !== req.params.id);
  res.json({ message: "Student and related records deleted" });
});

app.get("/api/fees", requireDemoAuth, (req, res) => {
  const month = req.query.month || currentMonth();
  const filteredStudents = students.filter((student) => !req.query.class || student.class === req.query.class);
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
  }));
  res.json({ month, fees: feeRows });
});

app.put("/api/fees/:studentId/:month", requireDemoAuth, (req, res) => {
  const student = students.find((item) => item._id === req.params.studentId);
  if (!student) return res.status(404).json({ message: "Student not found" });
  const amountPaid = Number(req.body.amountPaid || 0);
  const status = amountPaid === 0 ? "due" : amountPaid >= student.feeAmount ? "paid" : "partial";
  let record = fees.find((fee) => fee.studentId === student._id && fee.month === req.params.month);
  if (!record) {
    record = { _id: makeId("fee"), teacherId: teacher._id, studentId: student._id, month: req.params.month };
    fees.push(record);
  }
  Object.assign(record, {
    amountPaid,
    amountDue: student.feeAmount,
    status,
    paidOn: amountPaid ? new Date().toISOString() : null,
    receiptNumber: amountPaid ? `TT-${req.params.month.replace("-", "")}-${Date.now().toString().slice(-4)}` : null,
  });
  res.json({ message: "Fee record updated", record, student });
});

app.get("/api/attendance", requireDemoAuth, (req, res) => {
  const date = req.query.date || today();
  const filteredStudents = students.filter((student) => !req.query.class || student.class === req.query.class);
  res.json({
    date,
    attendance: filteredStudents.map((student) => ({
      student,
      record: attendance.find((item) => item.studentId === student._id && item.date === date) || null,
    })),
  });
});

app.put("/api/attendance/mark", requireDemoAuth, (req, res) => {
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
  res.json({ notifications: notifications.filter((item) => item.month === month) });
});

app.get("/api/notifications/reminder-queue", requireDemoAuth, (req, res) => {
  const month = req.query.month || currentMonth();
  const currentFees = fees.filter((fee) => fee.month === month);
  const feeByStudent = new Map(currentFees.map((fee) => [fee.studentId, fee]));
  const reminders = students
    .map((student, index) => {
      const record = feeByStudent.get(student._id);
      const amountPaid = Number(record?.amountPaid || 0);
      const amountDue = Math.max(student.feeAmount - amountPaid, 0);
      if (amountDue <= 0 || record?.status === "paid") return null;
      const type = record?.status === "partial" ? "partial" : index % 2 === 0 ? "overdue" : "upcoming_due";
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
        dueDate: new Date(now.getFullYear(), now.getMonth(), student.feeDueDate).toISOString(),
        daysUntilDue: type === "overdue" ? -2 : 2,
        message: buildDemoReminder({ student, month, amountDue, type }),
      };
    })
    .filter(Boolean);
  res.json({ month, reminders });
});

app.post("/api/notifications/open/:studentId", requireDemoAuth, (req, res) => {
  const student = students.find((item) => item._id === req.params.studentId);
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
  const student = students.find((item) => item._id === req.params.studentId);
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
  const expectedRevenue = students.reduce((sum, student) => sum + student.feeAmount, 0);
  const monthlyExpenses = expenses.filter((expense) => expense.date.startsWith(month)).reduce((sum, expense) => sum + expense.amount, 0);
  const currentAttendance = attendance.filter((item) => item.date.startsWith(month));
  const presentCount = currentAttendance.filter((item) => item.status === "present").length;
  const avgAttendance = currentAttendance.length ? Math.round((presentCount / currentAttendance.length) * 100) : 0;
  const feeByStudent = new Map(currentFees.map((fee) => [fee.studentId, fee]));
  const feeCollection = students.reduce((result, student) => {
    const fee = feeByStudent.get(student._id);
    result[fee?.status || "due"] += 1;
    return result;
  }, { paid: 0, partial: 0, due: 0 });
  const chartMonths = previousMonths(6);

  res.json({
    month,
    stats: {
      totalStudents: students.length,
      monthlyRevenue,
      pendingFees: Math.max(expectedRevenue - monthlyRevenue, 0),
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
