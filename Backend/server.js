require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const path     = require("path");

const dispatchRoutes = require("./routes/dispatches");
const authRoutes     = require("./routes/auth");
const disputeRoutes  = require("./routes/disputes");
const reviewRoutes   = require("./routes/reviews");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Ensure uploads directory exists (Render filesystem is ephemeral) ──────
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── CORS ─────────────────────────────────────────────────────────────────
// Open during development — tighten this in production by setting FRONTEND_URL
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowed = [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
    ].filter(Boolean);

    // Also allow any Vercel preview deployment URLs
    if (!origin || allowed.includes(origin) || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    // In development, allow everything
    if (process.env.NODE_ENV !== "production") return callback(null, true);

    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods:     ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Handle preflight OPTIONS requests for all routes
app.options("*", cors());

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Health check (before other routes) ───────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    time:   new Date().toISOString(),
    db:     mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/dispatches", dispatchRoutes);
app.use("/api/disputes",   disputeRoutes);
app.use("/api/reviews",    reviewRoutes);

// ── 404 handler — catches any unknown route ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global error handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Server Error]", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ── MongoDB + start ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/swiftport";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅  MongoDB connected →", MONGO_URI.replace(/\/\/.*@/, "//***@"));
    app.listen(PORT, () => {
      console.log(`🚀  SwiftPort backend running on http://localhost:${PORT}`);
      console.log(`🩺  Health check: http://localhost:${PORT}/api/health`);
      console.log(`📦  Dispatches:   http://localhost:${PORT}/api/dispatches`);
    });
  })
  .catch(err => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });
