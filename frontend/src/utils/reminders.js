import { formatCurrency, formatDate } from "./format";

export const DEFAULT_MESSAGE_TEMPLATE = "Namaste {parentName} ji, reminder: {studentName} ki {month} tuition fee {amountDue} due hai. Kripya time par payment kar dein. - {teacherName}";

export function getMessageTemplate() {
  return localStorage.getItem("tuitiontrack_message_template") || DEFAULT_MESSAGE_TEMPLATE;
}

export function renderReminderMessage(template, reminder, teacherName) {
  return template
    .replaceAll("{parentName}", reminder.parentName || "Parent")
    .replaceAll("{studentName}", reminder.studentName || "student")
    .replaceAll("{month}", reminder.month || "")
    .replaceAll("{amountDue}", formatCurrency(reminder.amountDue))
    .replaceAll("{dueDate}", reminder.dueDate ? formatDate(reminder.dueDate) : "the due date")
    .replaceAll("{teacherName}", teacherName || "TuitionTrack");
}
