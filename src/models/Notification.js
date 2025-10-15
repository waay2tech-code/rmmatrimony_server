const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // user who gets notified
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // user who initiated action
  type: { type: String, enum: ["like", "message", "interest"], required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", NotificationSchema);
