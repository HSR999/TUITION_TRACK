const express = require("express");
const Institute = require("../models/Institute");
const protect = require("../middleware/protect");
const { getInstituteId, requireOwner } = require("../utils/access");

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  const institute = req.teacher.instituteId;
  res.json({
    institute: institute ? {
      id: institute._id,
      name: institute.name,
      logoUrl: institute.logoUrl,
      phone: institute.phone,
      address: institute.address,
    } : null,
  });
});

router.put("/", requireOwner, async (req, res) => {
  try {
    const instituteId = getInstituteId(req);
    const updates = Object.fromEntries(
      ["name", "logoUrl", "phone", "address"]
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [field, req.body[field]])
    );

    const institute = await Institute.findByIdAndUpdate(
      instituteId,
      updates,
      { new: true, runValidators: true }
    );

    if (!institute) return res.status(404).json({ message: "Institute not found" });

    res.json({
      message: "Institute updated",
      institute: {
        id: institute._id,
        name: institute.name,
        logoUrl: institute.logoUrl,
        phone: institute.phone,
        address: institute.address,
      },
    });
  } catch (error) {
    res.status(400).json({ message: "Could not update institute", error: error.message });
  }
});

module.exports = router;
