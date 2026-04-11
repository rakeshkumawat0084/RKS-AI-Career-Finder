const express = require("express");
const router  = express.Router();
const Visitor = require("../models/Visitor");

// POST track visit (public)
router.post("/track", async (req, res) => {
  try {
    const today = new Date().toLocaleDateString("en-IN");
    await Visitor.findOneAndUpdate({ date: today }, { $inc: { count: 1 } }, { upsert: true, new: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all visitors (admin only)
router.get("/", async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    const total = visitors.reduce((sum, v) => sum + v.count, 0);
    const today = new Date().toLocaleDateString("en-IN");
    const todayVisits = visitors.find(v => v.date === today)?.count || 0;
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (13 - i));
      const key = d.toLocaleDateString("en-IN");
      return { label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), count: visitors.find(v => v.date === key)?.count || 0 };
    });
    res.json({ success: true, data: visitors, total, todayVisits, last14 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
