const express = require("express");
const Teacher = require("../models/Teacher");
const protect = require("../middleware/protect");
const { getInstituteId, requireOwner } = require("../utils/access");

const router = express.Router();
router.use(protect);
router.use(requireOwner);

const serializeMember = (teacher) => ({
  id: teacher._id,
  name: teacher.name,
  email: teacher.email,
  role: teacher.role,
  phone: teacher.phone || "",
  createdAt: teacher.createdAt,
});

router.get("/", async (req, res) => {
  try {
    const instituteId = getInstituteId(req);
    const members = await Teacher.find({ instituteId })
      .select("name email role phone createdAt")
      .sort({ role: 1, name: 1 });

    res.json({ members: members.map(serializeMember) });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch team members", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const instituteId = getInstituteId(req);
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await Teacher.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "A user with this email already exists" });

    const member = await Teacher.create({
      instituteId,
      name,
      email: normalizedEmail,
      password,
      phone,
      role: "teacher",
    });

    res.status(201).json({
      message: "Teacher added to institute",
      member: serializeMember(member),
    });
  } catch (error) {
    res.status(400).json({ message: "Could not add teacher", error: error.message });
  }
});

module.exports = router;
