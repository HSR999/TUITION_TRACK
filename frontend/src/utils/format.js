export const formatCurrency = (amount = 0) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
}).format(amount);

export const formatDate = (date) => date
  ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date))
  : "—";

export const currentMonth = () => new Date().toISOString().slice(0, 7);
export const today = () => new Date().toISOString().slice(0, 10);

export const getErrorMessage = (error) => {
  if (error.code === "ERR_NETWORK") {
    return "Network error: backend server is not reachable. Start backend on port 5000 and check MongoDB Atlas connection.";
  }
  return error.response?.data?.message || error.message || "Something went wrong";
};
