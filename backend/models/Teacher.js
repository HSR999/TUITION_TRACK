
const mongoose =require("mongoose");
const bcrypt = require("bcryptjs");

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
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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
    },

    reminderTemplates: {
      upcoming_due: { type: String, default: "" },
      overdue: { type: String, default: "" },
      partial: { type: String, default: "" },
      manual: { type: String, default: "" },
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
