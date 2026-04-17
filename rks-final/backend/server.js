require("dotenv").config();

const express       = require("express");
const mongoose      = require("mongoose");
const cors          = require("cors");
const helmet        = require("helmet");
const rateLimit     = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Startup checks ───────────────────────────────────────────
if (!process.env.MONGO_URI || process.env.MONGO_URI.includes("YOUR_USERNAME")) {
  console.error("\n❌ MONGO_URI not set in backend/.env — add your MongoDB Atlas string\n");
  process.exit(1);
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("❌ JWT_SECRET missing or too short in backend/.env\n");
  process.exit(1);
}

// ── Security headers ───────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.set("trust proxy", 1);

// ── CORS ──────────────────────────────────────────
const allowed = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_PROD,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error("CORS blocked: " + origin));
  },
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true,
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(mongoSanitize());

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: "Too many requests." },
  standardHeaders: true, legacyHeaders: false,
  skip: req => req.method === "OPTIONS",
}));

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.EMAIL_RATE_LIMIT_MAX) || 10,
  message: { success: false, message: "Email limit reached, try again in 1 hour." },
});

// ── Dev logger ────────────────────────────────────────────────────────────────___
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => res.json({ success: true, message: "RKS CODE API ✅" }));
app.get("/api/health", (_req, res) => res.json({
  status: "ok",
  db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
}));

// ── Load models (needed for inline public routes below) ───────────────────────
const Lead    = require("./models/Lead");
const Message = require("./models/Message");
const Visitor = require("./models/Visitor");

// ── Auth (public) ─────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));

// ── PUBLIC write routes — users submit forms, no JWT ─────────────────────────
app.post("/api/leads", async (req, res) => {
  try {
    const lead = new Lead(req.body);
    await lead.save();
    res.status(201).json({ success: true, message: "Lead saved.", data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { name, email, msg } = req.body;
    if (!name || !email || !msg) {
      return res.status(400).json({ success: false, message: "Name, email and message are required." });
    }
    const message = new Message({ name, email, msg });
    await message.save();
    res.status(201).json({ success: true, message: "Message sent.", data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/visitors/track", async (req, res) => {
  try {
    const today = new Date().toLocaleDateString("en-IN");
    await Visitor.findOneAndUpdate({ date: today }, { $inc: { count: 1 } }, { upsert: true, new: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PROTECTED routes — admin only (JWT required) ──────────────────────────────
const { protect } = require("./middleware/auth");

// All leads admin routes
app.use("/api/leads",    protect, require("./routes/leads"));
// All messages admin routes
app.use("/api/messages", protect, require("./routes/messages"));
// All visitors admin routes
app.use("/api/visitors", protect, require("./routes/visitors"));
// Email route
app.use("/api/email",    protect, emailLimiter, require("./routes/email"));

// ── 404 & error ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `${req.method} ${req.path} not found` }));
app.use((err, _req, res, _next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal server error" });
});

// ── Connect & start ───────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Atlas connected");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 RKS CODE API on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
      console.log(`🌐 http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB failed:", err.message);
    if (err.message.includes("bad auth") || err.message.includes("authentication failed")) {
      console.error("💡 Fix: Wrong MongoDB password. Reset it on Atlas → Database Access");
    }
    process.exit(1);
  });
