const mongoose = require("mongoose");
const { normalizePhone } = require("../utils/validation");

const phoneField = (required) => ({
  type: String,
  required,
  trim: true,
  set: (value) => normalizePhone(value),
  validate: {
    validator: (value) => !value || /^\+[1-9]\d{7,14}$/.test(value),
    message: "Phone must include a valid country code",
  },
});

const studentSchema = new mongoose.Schema(
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
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    phone: phoneField(false),
    parentName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    parentPhone: phoneField(true),
    parentEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
      maxlength: 254,
      validate: {
        validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Enter a valid parent email",
      },
    },
    class: { type: String, required: true, trim: true, minlength: 1, maxlength: 60, index: true },
    feeAmount: { type: Number, required: true, min: 0, max: 100000000, validate: Number.isFinite },
    feeDueDate: { type: Number, required: true, min: 1, max: 31 },
    address: { type: String, trim: true, default: "", maxlength: 300 },
    joinedAt: { type: Date, default: Date.now },
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

studentSchema.index({ teacherId: 1, class: 1, name: 1 });
studentSchema.index({ instituteId: 1, class: 1, name: 1 });

module.exports = mongoose.model("Student", studentSchema);
