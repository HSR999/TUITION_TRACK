export const formatCurrency = (amount = 0) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
}).format(amount);

export const formatDate = (date) => date
  ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date))
  : "—";

const indiaDateParts = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).formatToParts(new Date()).reduce((values, part) => {
  if (part.type !== "literal") values[part.type] = part.value;
  return values;
}, {});

export const currentMonth = () => {
  const { year, month } = indiaDateParts();
  return `${year}-${month}`;
};
export const today = () => {
  const { year, month, day } = indiaDateParts();
  return `${year}-${month}-${day}`;
};

export const getErrorMessage = (error) => {
  if (error.code === "ERR_NETWORK") {
    const isDeployed = typeof window !== "undefined" && window.location.hostname !== "localhost";
    return isDeployed
      ? "The deployed frontend cannot reach its API. Set VITE_API_URL in Vercel to your public backend URL ending in /api, then redeploy."
      : "Network error: backend server is not reachable. Start backend on port 5000 and check MongoDB Atlas connection.";
  }
  return error.response?.data?.message || error.message || "Something went wrong";
};
