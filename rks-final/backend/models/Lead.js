const mongoose = require("mongoose");

const LeadSchema = new mongoose.Schema({
  name:     { type: String, trim: true, default: "" },
  email:    { type: String, trim: true, lowercase: true, default: "" },
  phone:    { type: String, trim: true, default: "" },
  stream:   { type: String, trim: true, default: "" },
  edu:      { type: String, trim: true, default: "" },
  interests:{ type: String, trim: true, default: "" },
  workType: { type: String, trim: true, default: "" },
  goal:     { type: String, trim: true, default: "" },
  salary:   { type: Number, default: 0 },
  skills:   { type: [String], default: [] },
  isRead:   { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Lead", LeadSchema);
