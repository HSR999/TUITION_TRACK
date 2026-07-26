const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const currentMonth = () => new Date().toISOString().slice(0, 7);

const monthRange = (month) => {
  if (!MONTH_PATTERN.test(month)) {
    throw new Error("Month must use YYYY-MM format");
  }

  const [year, monthNumber] = month.split("-").map(Number);
  return {
    start: new Date(year, monthNumber - 1, 1),
    end: new Date(year, monthNumber, 1),
  };
};

module.exports = { MONTH_PATTERN, currentMonth, monthRange };
