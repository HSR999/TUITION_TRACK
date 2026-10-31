const normalizePhone = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const hasInternationalPrefix = raw.startsWith("+") || raw.startsWith("00");
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!hasInternationalPrefix && digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (!hasInternationalPrefix && digits.length === 10) digits = `91${digits}`;
  if (!digits || digits.length < 8 || digits.length > 15 || digits.startsWith("0")) {
    throw new Error("Enter a valid phone number with country code");
  }
  return `+${digits}`;
};

const isValidDateKey = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const getIndiaDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

module.exports = { getIndiaDateKey, isValidDateKey, normalizePhone };
