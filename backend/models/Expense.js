const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
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
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    category: {
      type: String,
      required: true,
      enum: ["rent", "utilities", "supplies", "travel", "salary", "other"],
      default: "other",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
