const mongoose = require("mongoose");

const feeRecordSchema = new mongoose.Schema(
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
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
      index: true,
    },
    amountPaid: { type: Number, default: 0, min: 0 },
    amountDue: { type: Number, required: true, min: 0 },
    paidOn: { type: Date, default: null },
    status: {
      type: String,
      enum: ["paid", "partial", "due"],
      default: "due",
    },
    receiptNumber: { type: String, default: null },
  },
  { timestamps: true }
);

feeRecordSchema.index({ teacherId: 1, studentId: 1, month: 1 }, { unique: true });
feeRecordSchema.index({ instituteId: 1, studentId: 1, month: 1 });

module.exports = mongoose.model("FeeRecord", feeRecordSchema);
