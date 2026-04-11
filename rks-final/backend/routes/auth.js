const express   = require("express");
const router    = express.Router();
const jwt       = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Try again in 15 minutes." },
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }
    if (
      username.trim().toLowerCase() !== (process.env.ADMIN_USERNAME || "").toLowerCase() ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }
    const token = jwt.sign(
      { username: process.env.ADMIN_USERNAME, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
    );
    res.json({ success: true, token, message: "Login successful." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during login." });
  }
});

// POST /api/auth/forgot
router.post("/forgot", loginLimiter, (req, res) => {
  const { answer } = req.body;
  if (!answer) return res.status(400).json({ success: false, message: "Answer is required." });
  if (answer.trim().toLowerCase() !== (process.env.RECOVERY_ANSWER || "").toLowerCase()) {
    return res.status(401).json({ success: false, message: "Wrong answer. Try again." });
  }
  res.json({ success: true, message: "Answer correct! Update ADMIN_PASSWORD in your .env file to reset." });
});

// GET /api/auth/verify
router.get("/verify", (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return res.json({ valid: false });
    jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    res.json({ valid: true });
  } catch {
    res.json({ valid: false });
  }
});

module.exports = router;
