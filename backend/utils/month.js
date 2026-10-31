const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const currentMonth = () => {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}`;
};

const monthRange = (month) => {
  if (!MONTH_PATTERN.test(month)) {
    throw new Error("Month must use YYYY-MM format");
  }

  const [year, monthNumber] = month.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, monthNumber - 1, 1)),
    end: new Date(Date.UTC(year, monthNumber, 1)),
  };
};

module.exports = { MONTH_PATTERN, currentMonth, monthRange };
