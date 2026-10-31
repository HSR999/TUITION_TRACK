const mongoose = require("mongoose");

const feePaymentSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/, index: true },
    amount: { type: Number, required: true, min: 0.01, max: 100000000 },
    paidAt: { type: Date, required: true, default: Date.now },
    receiptNumber: { type: String, required: true, trim: true },
    method: { type: String, enum: ["cash", "upi", "bank_transfer", "other"], default: "other" },
    note: { type: String, trim: true, maxlength: 250, default: "" },
    statusAfterPayment: { type: String, enum: ["paid", "partial"], required: true },
    isLegacy: { type: Boolean, default: false },
  },
  { timestamps: true }
);

feePaymentSchema.index({ teacherId: 1, studentId: 1, month: 1, paidAt: -1 });
feePaymentSchema.index({ instituteId: 1, studentId: 1, month: 1, paidAt: -1 });

module.exports = mongoose.model("FeePayment", feePaymentSchema);
