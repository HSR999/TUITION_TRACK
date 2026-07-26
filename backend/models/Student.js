const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    parentName: { type: String, required: true, trim: true },
    parentPhone: { type: String, required: true, trim: true },
    parentEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    class: {
      type: String,
      required: true,
      enum: ["9", "10", "11"],
      index: true,
    },
    feeAmount: { type: Number, required: true, min: 0 },
    feeDueDate: { type: Number, required: true, min: 1, max: 31 },
    address: { type: String, trim: true, default: "" },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

studentSchema.index({ teacherId: 1, class: 1, name: 1 });

module.exports = mongoose.model("Student", studentSchema);
