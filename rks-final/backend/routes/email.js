const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// POST /api/email/send (admin only - protected by server.js)
router.post("/send", async (req, res) => {
  try {
    const { to, toName, subject, body, type } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, message: "to, subject, and body are required." });
    }
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS || process.env.GMAIL_PASS === "xxxx_xxxx_xxxx_xxxx") {
      return res.status(500).json({ success: false, message: "Gmail not configured. Add GMAIL_USER and GMAIL_PASS to .env file." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      },
      pool: true,
      maxConnections: 1,
      maxMessages: Infinity,
      rateDelta: 1000,
      rateLimit: 5
    });

    const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f6ff;margin:0;padding:20px}
.wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(59,130,246,0.1)}
.header{background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px 40px;text-align:center}
.header h1{color:#fff;margin:0;font-size:24px;font-weight:800}
.header p{color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px}
.body{padding:36px 40px;color:#333;font-size:15px;line-height:1.7;white-space:pre-wrap}
.footer{background:#f8f9ff;border-top:1px solid #eef0ff;padding:20px 40px;text-align:center;font-size:12px;color:#888}
.footer a{color:#3b82f6;text-decoration:none}
.badge{display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:16px}
</style></head>
<body><div class="wrap">
<div class="header"><h1>🚀 RKS CODE</h1><p>AI Career Path Recommendation System</p></div>
<div class="body">
<div class="badge">${type === "reply" ? "📬 Message Reply" : "🎯 Career Recommendation"}</div><br/>
${body.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}
</div>
<div class="footer">
<p>Sent from <a href="mailto:${process.env.GMAIL_USER}">${process.env.GMAIL_USER}</a> | <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}">RKS CODE</a></p>
</div></div></body></html>`;

    await transporter.sendMail({
      from: `"RKS CODE Support" <${process.env.GMAIL_USER}>`,
      to, subject,
      text: body,
      html: htmlBody,
      replyTo: process.env.GMAIL_USER,
    });

    res.json({ success: true, message: `Email sent to ${to}` });
  } catch (err) {
    console.error("Email error:", err.message);
    let msg = "Failed to send email.";
    if (err.message.includes("Invalid login") || err.message.includes("Username and Password")) {
      msg = "Gmail login failed. Check GMAIL_USER and GMAIL_PASS in .env";
    }
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /api/email/test
router.get("/test", async (req, res) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS || process.env.GMAIL_PASS === "xxxx_xxxx_xxxx_xxxx") {
    return res.json({ success: false, configured: false, message: "Gmail not configured in .env" });
  }
  try {
    const t = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS } });
    await t.verify();
    res.json({ success: true, configured: true, user: process.env.GMAIL_USER });
  } catch (err) {
    res.json({ success: false, configured: true, message: err.message });
  }
});

module.exports = router;
