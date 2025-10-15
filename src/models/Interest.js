const mongoose = require("mongoose");

const interestSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Interest", interestSchema);
