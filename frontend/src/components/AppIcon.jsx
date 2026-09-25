const fallbackLabels = {
  dashboard: "D",
  students: "S",
  fees: "F",
  attendance: "A",
  expenses: "E",
  receipts: "R",
  notifications: "N",
  logout: "L",
  logo: "T",
  revenue: "₹",
  teacher: "T",
  team: "T",
  settings: "S",
  reminder: "!",
  security: "S",
  pdf: "P",
  calendar: "C",
};

export default function AppIcon({ name, className = "h-5 w-5", fallbackClassName = "" }) {
  const fallback = fallbackLabels[name] || name?.slice(0, 1)?.toUpperCase() || "?";

  return (
    <span className={`relative inline-grid place-items-center overflow-hidden ${className}`}>
      <img
        src={`/icons/${name}.svg`}
        alt=""
        className="h-full w-full object-contain"
        onError={(event) => {
          const image = event.currentTarget;
          if (!image.dataset.triedPng) {
            image.dataset.triedPng = "true";
            image.src = `/icons/${name}.png`;
            return;
          }
          image.style.display = "none";
          image.nextElementSibling.style.display = "grid";
        }}
      />
      <span className={`hidden h-full w-full place-items-center rounded-xl bg-indigo-50 text-[0.7em] font-black text-indigo-600 ${fallbackClassName}`}>
        {fallback}
      </span>
    </span>
  );
}
