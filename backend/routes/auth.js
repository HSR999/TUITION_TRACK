
const express = require("express");
const Teacher = require("../models/Teacher");
const Institute = require("../models/Institute");
const jwt = require("jsonwebtoken");
const protect = require("../middleware/protect");


const router = express.Router();

const generateToken = (teacherId) => {
  return jwt.sign(
    { id: teacherId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const serializeInstitute = (institute) => {
  if (!institute) return null;
  return {
    id: institute._id,
    name: institute.name,
    logoUrl: institute.logoUrl,
    phone: institute.phone,
    address: institute.address,
  };
};

const serializeTeacher = (teacher) => ({
  id: teacher._id,
  name: teacher.name,
  email: teacher.email,
  role: teacher.role || "owner",
  phone: teacher.phone || "",
  institute: serializeInstitute(teacher.instituteId),
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, instituteName, instituteLogoUrl, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingTeacher = await Teacher.findOne({
      email: normalizedEmail,
    });

    if (existingTeacher) {
      return res.status(409).json({
        message: "Teacher already exists",
      });
    }

    const institute = await Institute.create({
      name: instituteName?.trim() || `${name.trim()}'s Tuition`,
      logoUrl: instituteLogoUrl?.trim() || "",
      phone: phone?.trim() || "",
    });

    const teacher = await Teacher.create({
      instituteId: institute._id,
      name,
      email: normalizedEmail,
      password,
      role: "owner",
      phone,
    });

    institute.ownerId = teacher._id;
    await institute.save();
    await teacher.populate("instituteId", "name logoUrl phone address");

    res.status(201).json({
      message: "Institute owner registered successfully",
      teacher: serializeTeacher(teacher),
    });
  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const teacher = await Teacher.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password").populate("instituteId", "name logoUrl phone address");

    if (!teacher) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await teacher.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(teacher._id);

    res.status(200).json({
      message: "Login successful",
      token,
      teacher: serializeTeacher(teacher),
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

router.get("/me", protect, (req, res) => {
  res.status(200).json({
    teacher: serializeTeacher(req.teacher),
  });
});

module.exports = router;
