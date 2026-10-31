const mongoose = require("mongoose");
const { isValidDateKey } = require("../utils/validation");

const attendanceSchema = new mongoose.Schema(
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
    date: { type: String, required: true, validate: { validator: isValidDateKey, message: "Date must be a real date in YYYY-MM-DD format" } },
    status: { type: String, required: true, enum: ["present", "absent"] },
  },
  { timestamps: true }
);

attendanceSchema.index({ teacherId: 1, studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ instituteId: 1, studentId: 1, date: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
