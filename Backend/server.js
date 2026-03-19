require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet"); // npm i helmet
const rateLimit = require("express-rate-limit"); // npm i express-rate-limit
const chalk = require("chalk"); // npm i chalk (optional for colored logs)

// ── Routes ────────────────────────────────────────────────────────────────
const dispatchRoutes = require("./routes/dispatches");
const authRoutes = require("./routes/auth");
const disputeRoutes = require("./routes/disputes");
const reviewRoutes = require("./routes/reviews");
const sellerRoutes = require("./routes/sellerRoutes"); // ← NEW: profile + branding

// ── Cloudinary (for logo uploads) ─────────────────────────────────────────
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & Rate Limiting ──────────────────────────────────────────────
app.use(helmet()); // Adds security headers (XSS, clickjacking protection, etc.)

// Basic rate limit (adjust as needed)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api/", limiter); // Apply to all API routes

// ── CORS Configuration ─────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        if (process.env.NODE_ENV !== "production") {
          console.warn(chalk.yellow(`[CORS DEV] Allowing origin: ${origin}`));
          return callback(null, true);
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight
app.options("*", cors());

// ── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" })); // Increased limit for larger payloads if needed
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Static Files ───────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Health Check ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/dispatches", dispatchRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/seller", sellerRoutes); // ← NEW: /api/seller/profile (PATCH)

// ── 404 Not Found ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(chalk.red("[SERVER ERROR]"), err.stack || err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : err.message,
    ...(process.env.NODE_ENV !== "production" && { error: err.message, stack: err.stack }),
  });
});

// ── MongoDB Connection & Server Start ─────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/swiftport";

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(chalk.green("✅ MongoDB connected →"), MONGODB_URI.replace(/\/\/.*@/, "//***@"));

    const server = app.listen(PORT, () => {
      console.log(chalk.cyan(`🚀 SwiftPort backend running on http://localhost:${PORT}`));
      console.log(chalk.gray(`   Health:     http://localhost:${PORT}/api/health`));
      console.log(chalk.gray(`   Seller API:  http://localhost:${PORT}/api/seller/profile`));
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log(chalk.yellow("SIGTERM received. Shutting down gracefully..."));
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log(chalk.yellow("MongoDB connection closed."));
          process.exit(0);
        });
      });
    });
  })
  .catch((err) => {
    console.error(chalk.red("❌ MongoDB connection failed:"), err.message);
    process.exit(1);
  });