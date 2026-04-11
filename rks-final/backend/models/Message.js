const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  email:  { type: String, required: true, trim: true, lowercase: true },
  msg:    { type: String, required: true, trim: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Message", MessageSchema);
