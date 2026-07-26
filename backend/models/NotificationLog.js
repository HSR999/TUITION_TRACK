const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    recipientEmail: { type: String, lowercase: true, trim: true, default: "" },
    recipientPhone: { type: String, trim: true, default: "" },
    message: { type: String, default: "" },
    provider: { type: String, default: "whatsapp_deeplink" },
    providerMessageId: { type: String, default: "" },
    sentAt: { type: Date, default: Date.now },
    status: { type: String, required: true, enum: ["opened", "handled", "sent", "failed"] },
    channel: { type: String, enum: ["whatsapp_manual", "sms", "whatsapp"], default: "whatsapp_manual" },
    type: { type: String, enum: ["upcoming_due", "overdue", "partial", "manual"], default: "manual" },
    error: { type: String, default: null },
  },
  { timestamps: true }
);

notificationLogSchema.index({ teacherId: 1, month: 1, recipientPhone: 1, channel: 1, type: 1 });

module.exports = mongoose.model("NotificationLog", notificationLogSchema);
