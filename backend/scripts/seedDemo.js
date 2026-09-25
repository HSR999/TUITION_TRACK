const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const Teacher = require("../models/Teacher");
const Institute = require("../models/Institute");
const Student = require("../models/Student");
const FeeRecord = require("../models/FeeRecord");
const Attendance = require("../models/Attendance");
const Expense = require("../models/Expense");
const NotificationLog = require("../models/NotificationLog");

const DEMO_EMAIL = "demo@tuitiontrack.com";
const DEMO_PASSWORD = "Demo@12345";

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const dateKey = (date) => date.toISOString().slice(0, 10);

const addMonths = (date, offset) => new Date(date.getFullYear(), date.getMonth() + offset, 1);

const buildReceiptNumber = (month, index) => `TT-${month.replace("-", "")}-${String(index + 1).padStart(4, "0")}`;

const studentsSeed = [
  ["Aarav Sharma", "9876501001", "Rajesh Sharma", "9876509001", "9", 1800, 5, "Dwarka, Delhi"],
  ["Anaya Gupta", "9876501002", "Meena Gupta", "9876509002", "9", 1800, 8, "Rohini, Delhi"],
  ["Kabir Singh", "9876501003", "Harpreet Singh", "9876509003", "9", 2000, 10, "Pitampura, Delhi"],
  ["Meera Nair", "9876501004", "Sujatha Nair", "9876509004", "9", 1800, 12, "Janakpuri, Delhi"],
  ["Vivaan Verma", "9876501005", "Kavita Verma", "9876509005", "10", 2200, 5, "Tilak Nagar, Delhi"],
  ["Ishita Rao", "9876501006", "Prakash Rao", "9876509006", "10", 2200, 7, "Karol Bagh, Delhi"],
  ["Reyansh Jain", "9876501007", "Nitin Jain", "9876509007", "10", 2400, 9, "Rajouri Garden, Delhi"],
  ["Sara Khan", "9876501008", "Imran Khan", "9876509008", "10", 2200, 14, "Lajpat Nagar, Delhi"],
  ["Arjun Mehta", "9876501009", "Sanjay Mehta", "9876509009", "11", 3000, 5, "Paschim Vihar, Delhi"],
  ["Riya Malhotra", "9876501010", "Neha Malhotra", "9876509010", "11", 3200, 6, "Punjabi Bagh, Delhi"],
  ["Dev Kapoor", "9876501011", "Amit Kapoor", "9876509011", "11", 3000, 11, "Vikaspuri, Delhi"],
  ["Tara Bansal", "9876501012", "Pooja Bansal", "9876509012", "11", 3200, 15, "Model Town, Delhi"],
];

const connect = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing in backend/.env");
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    tls: true,
    family: 4,
  });
};

const clearExistingDemo = async () => {
  const existingTeacher = await Teacher.findOne({ email: DEMO_EMAIL });
  if (!existingTeacher) return;
  const ownershipFilter = existingTeacher.instituteId
    ? { $or: [{ teacherId: existingTeacher._id }, { instituteId: existingTeacher.instituteId }] }
    : { teacherId: existingTeacher._id };

  await Promise.all([
    Student.deleteMany(ownershipFilter),
    FeeRecord.deleteMany(ownershipFilter),
    Attendance.deleteMany(ownershipFilter),
    Expense.deleteMany(ownershipFilter),
    NotificationLog.deleteMany(ownershipFilter),
  ]);

  if (existingTeacher.instituteId) await Institute.deleteOne({ _id: existingTeacher.instituteId });
  await Teacher.deleteOne({ _id: existingTeacher._id });
};

const createTeacher = async () => {
  const institute = await Institute.create({
    name: "Bright Future Classes",
    phone: "9876500000",
    address: "Delhi, India",
  });

  const teacher = await Teacher.create({
    instituteId: institute._id,
    name: "Demo Owner",
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    role: "owner",
    phone: "9876500000",
  });

  institute.ownerId = teacher._id;
  await institute.save();

  return teacher;
};

const createStudents = async (teacherId, instituteId) => {
  const joinedAt = new Date(new Date().getFullYear(), 0, 10);
  return Student.insertMany(studentsSeed.map(([name, phone, parentName, parentPhone, className, feeAmount, feeDueDate, address], index) => ({
    teacherId,
    instituteId,
    name,
    phone,
    parentName,
    parentPhone,
    parentEmail: "",
    class: className,
    feeAmount,
    feeDueDate,
    address,
    joinedAt: new Date(joinedAt.getFullYear(), joinedAt.getMonth(), joinedAt.getDate() + index),
  })));
};

const createFeeRecords = async (teacherId, instituteId, students) => {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => monthKey(addMonths(now, index - 5)));
  const records = [];

  months.forEach((month, monthIndex) => {
    students.forEach((student, studentIndex) => {
      const isCurrentMonth = monthIndex === months.length - 1;
      const pattern = (studentIndex + monthIndex) % 5;
      let amountPaid = student.feeAmount;

      if (isCurrentMonth && pattern === 0) amountPaid = 0;
      else if (isCurrentMonth && pattern === 1) amountPaid = Math.round(student.feeAmount / 2);
      else if (!isCurrentMonth && pattern === 0) amountPaid = student.feeAmount - 300;

      const status = amountPaid === 0 ? "due" : amountPaid >= student.feeAmount ? "paid" : "partial";
      records.push({
        teacherId,
        instituteId,
        studentId: student._id,
        month,
        amountPaid,
        amountDue: student.feeAmount,
        paidOn: amountPaid > 0 ? new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, Math.min(student.feeDueDate + 1, 26)) : null,
        status,
        receiptNumber: amountPaid > 0 ? buildReceiptNumber(month, studentIndex + monthIndex * students.length) : null,
      });
    });
  });

  await FeeRecord.insertMany(records);
};

const createAttendance = async (teacherId, instituteId, students) => {
  const now = new Date();
  const records = [];

  for (let dayOffset = 0; dayOffset < 18; dayOffset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
    const day = date.getDay();
    if (day === 0) continue;

    students.forEach((student, index) => {
      records.push({
        teacherId,
        instituteId,
        studentId: student._id,
        date: dateKey(date),
        status: (index + dayOffset) % 7 === 0 ? "absent" : "present",
      });
    });
  }

  await Attendance.insertMany(records);
};

const createExpenses = async (teacherId, instituteId) => {
  const now = new Date();
  const expenses = [
    ["Classroom rent", 12000, "rent", 2],
    ["Whiteboard markers", 850, "supplies", 4],
    ["Internet bill", 999, "utilities", 6],
    ["Printed worksheets", 1450, "supplies", 9],
    ["Local travel", 1200, "travel", 13],
    ["Assistant payout", 5000, "salary", 18],
  ].map(([title, amount, category, day]) => ({
    teacherId,
    instituteId,
    title,
    amount,
    category,
    date: new Date(now.getFullYear(), now.getMonth(), Math.min(day, now.getDate())),
  }));

  await Expense.insertMany(expenses);
};

const createNotifications = async (teacherId, instituteId, students) => {
  const now = new Date();
  const month = monthKey(now);
  const logs = students.slice(0, 6).map((student, index) => ({
    teacherId,
    instituteId,
    studentId: student._id,
    month,
    recipientPhone: `+91${student.parentPhone}`,
    message: index % 2 === 0
      ? `TuitionTrack reminder: ${student.name}'s tuition fee for ${month} is due soon.`
      : `TuitionTrack reminder: ${student.name}'s tuition fee for ${month} is overdue. Please clear it soon.`,
    provider: "demo",
    providerMessageId: `demo-${index + 1}`,
    sentAt: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - index)),
    status: index === 5 ? "failed" : "sent",
    channel: index % 3 === 0 ? "whatsapp" : "sms",
    type: index % 2 === 0 ? "upcoming_due" : "overdue",
    error: index === 5 ? "Demo failed delivery example" : null,
  }));

  await NotificationLog.insertMany(logs);
};

const seed = async () => {
  await connect();
  await clearExistingDemo();

  const teacher = await createTeacher();
  const students = await createStudents(teacher._id, teacher.instituteId);

  await Promise.all([
    createFeeRecords(teacher._id, teacher.instituteId, students),
    createAttendance(teacher._id, teacher.instituteId, students),
    createExpenses(teacher._id, teacher.instituteId),
    createNotifications(teacher._id, teacher.instituteId, students),
  ]);

  console.log("Demo data seeded successfully");
  console.log(`Login email: ${DEMO_EMAIL}`);
  console.log(`Login password: ${DEMO_PASSWORD}`);
};

seed()
  .catch((error) => {
    console.error(`Demo seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
