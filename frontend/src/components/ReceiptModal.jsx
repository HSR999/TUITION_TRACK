import { jsPDF } from "jspdf";
import { formatCurrency, formatDate } from "../utils/format";

export default function ReceiptModal({ item, onClose }) {
  if (!item) return null;
  const { student, record } = item;
  const download = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(22); pdf.text("TuitionTrack", 20, 24);
    pdf.setFontSize(14); pdf.text("Fee Payment Receipt", 20, 36);
    pdf.setDrawColor(15, 118, 110); pdf.line(20, 42, 190, 42);
    pdf.setFontSize(11);
    const rows = [
      ["Receipt number", record.receiptNumber], ["Student", student.name], ["Class", `Class ${student.class}`],
      ["Month", record.month], ["Amount paid", formatCurrency(record.amountPaid)], ["Payment date", formatDate(record.paidOn)], ["Status", record.status.toUpperCase()],
    ];
    rows.forEach(([label, value], index) => { pdf.setFont("helvetica", "bold"); pdf.text(`${label}:`, 20, 56 + index * 10); pdf.setFont("helvetica", "normal"); pdf.text(String(value || "—"), 68, 56 + index * 10); });
    pdf.setFontSize(9); pdf.text("Computer-generated receipt", 20, 140);
    pdf.save(`${record.receiptNumber || "receipt"}.pdf`);
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onMouseDown={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
        <p className="text-sm font-bold text-brand-700">TUITIONTRACK</p><h2 className="mt-1 text-2xl font-black">Payment receipt</h2>
        <div className="my-5 space-y-3 border-y border-dashed border-slate-300 py-5 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Receipt</span><strong>{record.receiptNumber}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">Student</span><strong>{student.name}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">Month</span><strong>{record.month}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">Paid</span><strong>{formatCurrency(record.amountPaid)}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">Date</span><strong>{formatDate(record.paidOn)}</strong></div>
        </div>
        <div className="flex justify-end gap-3"><button className="btn-secondary" onClick={onClose}>Close</button><button className="btn-primary" onClick={download}>Download PDF</button></div>
      </div>
    </div>
  );
}
