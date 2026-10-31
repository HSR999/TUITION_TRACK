
const mongoose =require("mongoose");
const bcrypt = require("bcryptjs");
const { normalizePhone } = require("../utils/validation");

const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const teacherSchema = new mongoose.Schema({
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["owner", "teacher"],
      default: "owner",
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      set: (value) => normalizePhone(value),
      validate: {
        validator: (value) => !value || /^\+[1-9]\d{7,14}$/.test(value),
        message: "Phone must include a valid country code",
      },
    },

    reminderTemplates: {
      upcoming_due: { type: String, default: "" },
      overdue: { type: String, default: "" },
      partial: { type: String, default: "" },
      manual: { type: String, default: "" },
    },

    pushSubscriptions: {
      type: [pushSubscriptionSchema],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);


teacherSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

teacherSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Teacher", teacherSchema);
