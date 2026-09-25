const defaultReminderTemplates = {
  upcoming_due: "Namaste {parentName} ji, reminder: {studentName} ki {month} tuition fee {amountDue} due date {dueDate} ko hai. Kripya time par payment kar dein. - TuitionTrack",
  overdue: "Namaste {parentName} ji, {studentName} ki {month} tuition fee {amountDue} ab overdue hai. Due date {dueDate} thi. Kripya jaldi payment clear kar dein. - TuitionTrack",
  partial: "Namaste {parentName} ji, {studentName} ki {month} tuition fee me {amountDue} balance pending hai. Kripya remaining amount clear kar dein. - TuitionTrack",
  manual: "Namaste {parentName} ji, {studentName} ki {month} tuition fee {amountDue} pending hai. Kripya payment update kar dein. - TuitionTrack",
};

const normalizePhoneNumber = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.startsWith("91")) return digits;
  return digits;
};

const formatDueDate = (date) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(date);

const formatAmount = (amountDue) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
}).format(amountDue);

const getReminderTemplate = ({ templates = {}, type = "manual" } = {}) => {
  const template = templates?.[type];
  return template?.trim() || defaultReminderTemplates[type] || defaultReminderTemplates.manual;
};

const fillReminderTemplate = ({ template, student, month, dueDate, amountDue, type }) => {
  const values = {
    parentName: student.parentName || "Parent",
    studentName: student.name || "Student",
    month,
    dueDate: formatDueDate(dueDate),
    amountDue: formatAmount(amountDue),
    feeType: String(type || "manual").replaceAll("_", " "),
    class: student.class || "",
  };

  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template
  );
};

const buildManualReminderMessage = ({ student, month, dueDate, amountDue, type, templates }) => {
  const template = getReminderTemplate({ templates, type });
  return fillReminderTemplate({ template, student, month, dueDate, amountDue, type });
};

module.exports = {
  buildManualReminderMessage,
  defaultReminderTemplates,
  fillReminderTemplate,
  getReminderTemplate,
  normalizePhoneNumber,
};
