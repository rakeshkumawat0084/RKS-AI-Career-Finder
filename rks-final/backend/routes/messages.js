const express = require("express");
const router  = express.Router();
const Message = require("../models/Message");

// GET all messages (admin only)
router.get("/", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(200);
    const unreadCount = await Message.countDocuments({ isRead: false });
    res.json({ success: true, data: messages, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST save message (public)
router.post("/", async (req, res) => {
  try {
    const { name, email, msg } = req.body;
    if (!name || !email || !msg) {
      return res.status(400).json({ success: false, message: "Name, email and message are required." });
    }
    const message = new Message({ name, email, msg });
    await message.save();
    res.status(201).json({ success: true, message: "Message sent successfully.", data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH mark read (admin only)
router.patch("/:id/read", async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!message) return res.status(404).json({ success: false, message: "Message not found." });
    res.json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE single message (admin only)
router.delete("/:id", async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Message deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
