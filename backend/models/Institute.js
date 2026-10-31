const mongoose = require("mongoose");
const { normalizePhone } = require("../utils/validation");

const instituteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      minlength: 2,
    },
    logoUrl: {
      type: String,
      trim: true,
      default: "",
      set: (value) => normalizePhone(value),
      validate: {
        validator: (value) => !value || /^\+[1-9]\d{7,14}$/.test(value),
        message: "Phone must include a valid country code",
      },
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Institute", instituteSchema);
