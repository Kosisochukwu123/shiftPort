const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const Seller  = require("../models/Seller");
const { protect } = require("../middleware/auth");

// ── Helper: sign a JWT ────────────────────────────────────────────────────
function signToken(sellerId) {
  return jwt.sign(
    { id: sellerId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// ── Helper: send token response ───────────────────────────────────────────
function sendToken(seller, statusCode, res) {
  const token = signToken(seller._id);
  res.status(statusCode).json({
    success: true,
    token,
    seller,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Create a new seller account
// ─────────────────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { fullName, businessName, email, phone, password } = req.body;

    // Validate required fields
    const missing = [];
    if (!fullName?.trim())     missing.push("fullName");
    if (!businessName?.trim()) missing.push("businessName");
    if (!email?.trim())        missing.push("email");
    if (!password?.trim())     missing.push("password");

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // Check if email already registered
    const exists = await Seller.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    // Create seller — password is hashed by the pre-save hook
    const seller = await Seller.create({
      fullName:     fullName.trim(),
      businessName: businessName.trim(),
      email:        email.toLowerCase().trim(),
      phone:        phone?.trim() || "",
      password,
    });

    console.log(`[register] New seller: ${seller.email}`);
    sendToken(seller, 201, res);

  } catch (err) {
    console.error("[POST /auth/register]", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Seller logs in with email + password
// ─────────────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find seller — include password for comparison
    const seller = await Seller.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!seller) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Compare password
    const isMatch = await seller.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!seller.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Contact support.",
      });
    }

    console.log(`[login] Seller logged in: ${seller.email}`);
    sendToken(seller, 200, res);

  } catch (err) {
    console.error("[POST /auth/login]", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// Returns the currently logged-in seller's profile
// ─────────────────────────────────────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  res.json({ success: true, seller: req.seller });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/me
// Update seller profile — handles JSON body OR multipart/form-data (logo upload)
// Fields: fullName, businessName, email, phone,
//         businessPhone, whatsapp, instagram, logo (file),
//         currentPassword + newPassword (password change)
// ─────────────────────────────────────────────────────────────────────────────
const upload = require("../middleware/upload");

router.patch("/me", protect, upload.single("logo"), async (req, res) => {
  try {
    const {
      fullName, businessName, email, phone,
      businessPhone, whatsapp, instagram,
      currentPassword, newPassword,
    } = req.body;

    const updates = {};

    // ── Profile fields ────────────────────────────────────────────────────
    if (fullName?.trim())     updates.fullName     = fullName.trim();
    if (businessName?.trim()) updates.businessName = businessName.trim();
    if (email?.trim())        updates.email        = email.trim().toLowerCase();
    if (phone?.trim())        updates.phone        = phone.trim();

    // ── QR branding fields ────────────────────────────────────────────────
    if (businessPhone !== undefined) updates.businessPhone = businessPhone?.trim() || "";
    if (whatsapp      !== undefined) updates.whatsapp      = whatsapp?.trim()      || "";
    if (instagram     !== undefined) updates.instagram     = instagram?.trim()     || "";
    if (req.body.bio  !== undefined) updates.bio           = req.body.bio?.trim()  || "";

    // ── Logo file upload ──────────────────────────────────────────────────
    if (req.file) {
      updates.logo = `/uploads/${req.file.filename}`;
    }

    // ── Password change ───────────────────────────────────────────────────
    if (currentPassword && newPassword) {
      // Fetch with password hash for comparison
      const sellerWithPw = await require("../models/Seller").findById(req.seller._id).select("+password");
      if (!sellerWithPw) {
        return res.status(404).json({ success: false, message: "Seller not found." });
      }
      const isMatch = await sellerWithPw.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Current password is incorrect." });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: "New password must be at least 8 characters." });
      }
      // Set new password via the model so bcrypt pre-save hook fires
      sellerWithPw.password = newPassword;
      await sellerWithPw.save();
      // Return early after password save (no other field updates needed in same request)
      const refreshed = await require("../models/Seller").findById(req.seller._id);
      return res.json({ success: true, seller: refreshed });
    }

    // ── Apply updates ─────────────────────────────────────────────────────
    if (Object.keys(updates).length === 0) {
      return res.json({ success: true, seller: req.seller, message: "Nothing to update." });
    }

    const seller = await require("../models/Seller").findByIdAndUpdate(
      req.seller._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ success: true, seller });

  } catch (err) {
    console.error("[PATCH /auth/me]", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
