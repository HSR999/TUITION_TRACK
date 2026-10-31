const express = require("express");
const Student = require("../models/Student");
const protect = require("../middleware/protect");
const { getCreateOwnership, withDataScope } = require("../utils/access");

const router = express.Router();
router.use(protect);

const editableFields = [
  "name",
  "phone",
  "parentName",
  "parentPhone",
  "parentEmail",
  "class",
  "feeAmount",
  "feeDueDate",
  "address",
  "joinedAt",
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.get("/", async (req, res) => {
  try {
    const filters = req.query.includeArchived === "true" ? {} : { isArchived: { $ne: true } };
    if (req.query.class) filters.class = req.query.class;
    if (req.query.search) {
      const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
      filters.$or = [
        { name: search },
        { phone: search },
        { parentName: search },
        { parentPhone: search },
      ];
    }
    const query = withDataScope(req, filters);

    const students = await Student.find(query).sort({ class: 1, name: 1 });
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch students", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = Object.fromEntries(editableFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    const student = await Student.create({ ...data, ...getCreateOwnership(req) });
    res.status(201).json({ message: "Student added", student });
  } catch (error) {
    res.status(400).json({ message: "Could not add student", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findOne(withDataScope(req, { _id: req.params.id, isArchived: { $ne: true } }));
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ student });
  } catch (error) {
    res.status(400).json({ message: "Invalid student id", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updates = Object.fromEntries(editableFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    const student = await Student.findOneAndUpdate(
      withDataScope(req, { _id: req.params.id, isArchived: { $ne: true } }),
      updates,
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student updated", student });
  } catch (error) {
    res.status(400).json({ message: "Could not update student", error: error.message });
  }
});

const setArchived = async (req, res, isArchived) => {
  try {
    const student = await Student.findOneAndUpdate(
      withDataScope(req, { _id: req.params.id, isArchived: { $ne: isArchived } }),
      { isArchived, archivedAt: isArchived ? new Date() : null },
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ message: isArchived ? "Student archived" : "Student restored", student });
  } catch (error) {
    res.status(400).json({ message: "Could not update student archive status", error: error.message });
  }
};

router.patch("/:id/archive", (req, res) => setArchived(req, res, true));
router.patch("/:id/restore", (req, res) => setArchived(req, res, false));
router.delete("/:id", (req, res) => setArchived(req, res, true));

module.exports = router;
