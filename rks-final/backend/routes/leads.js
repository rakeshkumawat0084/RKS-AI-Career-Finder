const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");

// GET /api/leads/stats  — must be BEFORE /:id route
router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, todayCount, streamBreakdown, workTypeBreakdown, goalBreakdown, eduBreakdown] =
      await Promise.all([
        Lead.countDocuments(),
        Lead.countDocuments({ createdAt: { $gte: today } }),
        Lead.aggregate([{ $group: { _id: "$stream", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        Lead.aggregate([{ $match: { workType: { $ne: "" } } }, { $group: { _id: "$workType", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        Lead.aggregate([{ $match: { goal: { $ne: "" } } }, { $group: { _id: "$goal", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        Lead.aggregate([{ $match: { edu: { $ne: "" } } }, { $group: { _id: "$edu", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      ]);

    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const count = await Lead.countDocuments({ createdAt: { $gte: d, $lt: next } });
      last7.push({ label: d.toLocaleDateString("en-IN", { weekday: "short" }), count });
    }

    res.json({ success: true, data: { total, todayCount, streamBreakdown, workTypeBreakdown, goalBreakdown, eduBreakdown, last7 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/leads — get all leads (admin)
router.get("/", async (req, res) => {
  try {
    const { search = "", stream = "all", sort = "newest" } = req.query;
    const filter = {};
    if (stream !== "all") filter.stream = stream;
    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }
    const leads = await Lead.find(filter)
      .sort({ createdAt: sort === "oldest" ? 1 : -1 })
      .limit(500);
    res.json({ success: true, data: leads, total: leads.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/leads — save lead (public)
router.post("/", async (req, res) => {
  try {
    const lead = new Lead(req.body);
    await lead.save();
    res.status(201).json({ success: true, message: "Lead saved.", data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/leads/:id/read
router.patch("/:id/read", async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found." });
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/leads  — delete ALL (must be before /:id)
router.delete("/", async (req, res) => {
  try {
    const result = await Lead.deleteMany({});
    res.json({ success: true, message: `Deleted ${result.deletedCount} leads.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/leads/:id — delete one
router.delete("/:id", async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Lead deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
