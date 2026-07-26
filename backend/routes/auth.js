
const express = require("express");
const Teacher = require("../models/Teacher");
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


router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

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

    const teacher = await Teacher.create({
      name,
      email: normalizedEmail,
      password,
    });

    res.status(201).json({
      message: "Teacher registered successfully",
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
      },
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
    }).select("+password");

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
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
      },
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
    teacher: {
      id: req.teacher._id,
      name: req.teacher.name,
      email: req.teacher.email,
    },
  });
});

module.exports = router;
