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

const buildManualReminderMessage = ({ student, month, dueDate, amountDue, type }) => {
  const dueText = formatDueDate(dueDate);
  const amountText = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountDue);

  if (type === "overdue") {
    return `Namaste ${student.parentName} ji, ${student.name} ki ${month} tuition fee ${amountText} ab overdue hai. Due date ${dueText} thi. Kripya jaldi payment clear kar dein. - TuitionTrack`;
  }

  if (type === "partial") {
    return `Namaste ${student.parentName} ji, ${student.name} ki ${month} tuition fee me ${amountText} balance pending hai. Kripya remaining amount clear kar dein. - TuitionTrack`;
  }

  return `Namaste ${student.parentName} ji, reminder: ${student.name} ki ${month} tuition fee ${amountText} due date ${dueText} ko hai. Kripya time par payment kar dein. - TuitionTrack`;
};

module.exports = {
  buildManualReminderMessage,
  normalizePhoneNumber,
};
