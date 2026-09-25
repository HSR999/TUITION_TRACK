const express = require("express");
const Expense = require("../models/Expense");
const protect = require("../middleware/protect");
const { MONTH_PATTERN, monthRange } = require("../utils/month");
const { getCreateOwnership, withDataScope } = require("../utils/access");

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  try {
    const filters = {};
    if (req.query.month) {
      if (!MONTH_PATTERN.test(req.query.month)) return res.status(400).json({ message: "Month must use YYYY-MM format" });
      const { start, end } = monthRange(req.query.month);
      filters.date = { $gte: start, $lt: end };
    }
    const query = withDataScope(req, filters);
    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json({ expenses });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch expenses", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, amount, date, category } = req.body;
    const expense = await Expense.create({ ...getCreateOwnership(req), title, amount, date, category });
    res.status(201).json({ message: "Expense added", expense });
  } catch (error) {
    res.status(400).json({ message: "Could not add expense", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updates = Object.fromEntries(["title", "amount", "date", "category"].filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    const expense = await Expense.findOneAndUpdate(
      withDataScope(req, { _id: req.params.id }),
      updates,
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense updated", expense });
  } catch (error) {
    res.status(400).json({ message: "Could not update expense", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete(withDataScope(req, { _id: req.params.id }));
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(400).json({ message: "Could not delete expense", error: error.message });
  }
});

module.exports = router;
