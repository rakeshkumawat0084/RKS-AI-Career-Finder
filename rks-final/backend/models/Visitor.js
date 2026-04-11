const mongoose = require("mongoose");

const VisitorSchema = new mongoose.Schema({
  date:  { type: String, required: true, unique: true },
  count: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model("Visitor", VisitorSchema);
