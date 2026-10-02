const webPush = require("web-push");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const FeeRecord = require("../models/FeeRecord");
const { withDataScope } = require("../utils/access");

const getTodayInIndia = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const getCurrentMonthInIndia = (today) => today.slice(0, 7);

const getFeeSummary = async (teacher, month, today) => {
  const req = { teacher };
  const students = await Student.find(withDataScope(req)).select("feeAmount feeDueDate").lean();
  const studentIds = students.map((student) => student._id);
  const records = studentIds.length
    ? await FeeRecord.find(withDataScope(req, { month, studentId: { $in: studentIds } }))
      .select("studentId amountPaid status")
      .lean()
    : [];
  const byStudent = new Map(records.map((record) => [record.studentId.toString(), record]));

  return students.reduce((summary, student) => {
    const record = byStudent.get(student._id.toString());
    const due = Math.max(Number(student.feeAmount || 0) - Number(record?.amountPaid || 0), 0);
    if (!due) return summary;

    summary.count += 1;
    summary.amount += due;
    const [year, monthNumber] = month.split("-").map(Number);
    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const dueDay = String(Math.min(Number(student.feeDueDate || 1), lastDay)).padStart(2, "0");
    const dueDate = `${month}-${dueDay}`;
    if (dueDate < today) summary.overdue += 1;
    return summary;
  }, { count: 0, overdue: 0, amount: 0 });
};

const configureWebPush = () => {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required to send phone notifications");
  }
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@tuitiontrack.app",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
};

const runDailyFeePushJob = async () => {
  configureWebPush();
  const today = getTodayInIndia();
  const month = getCurrentMonthInIndia(today);
  const teachers = await Teacher.find({ "pushSubscriptions.0": { $exists: true } })
    .select("+pushSubscriptions instituteId role name")
    .lean();
  let delivered = 0;
  let removed = 0;

  for (const teacher of teachers) {
    const summary = await getFeeSummary(teacher, month, today);
    if (summary.count === 0) continue;

    const payload = JSON.stringify({
      title: "TuitionTrack fee update",
      body: `${summary.count} student${summary.count === 1 ? "" : "s"} have pending fees (${summary.overdue} overdue), total ₹${summary.amount.toLocaleString("en-IN")}.`,
      url: "/fees",
    });

    for (const subscription of teacher.pushSubscriptions) {
      try {
        await webPush.sendNotification(subscription, payload);
        delivered += 1;
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await Teacher.updateOne(
            { _id: teacher._id },
            { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } }
          );
          removed += 1;
          continue;
        }
        console.error(`Push notification failed for teacher ${teacher._id}: ${error.message}`);
      }
    }
  }

  console.log(`Daily fee push job completed: ${delivered} sent, ${removed} expired subscriptions removed`);
};

module.exports = { runDailyFeePushJob };
