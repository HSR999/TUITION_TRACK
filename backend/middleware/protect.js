
const jwt = require("jsonwebtoken");
const Teacher = require("../models/Teacher");

const protect = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (
    !authorizationHeader ||
    !authorizationHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      message: "Authorization token is required",
    });
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const teacher = await Teacher.findById(decodedToken.id);

    if (!teacher) {
      return res.status(401).json({
        message: "Teacher account no longer exists",
      });
    }

    req.teacher = teacher;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;