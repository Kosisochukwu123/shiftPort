const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const SellerSchema = new mongoose.Schema({

  // Store / business name shown to buyers
  businessName: {
    type:     String,
    required: true,
    trim:     true,
  },

  // Full name of the seller
  fullName: {
    type:     String,
    required: true,
    trim:     true,
  },

  // Login email — must be unique
  email: {
    type:      String,
    required:  true,
    unique:    true,
    lowercase: true,
    trim:      true,
  },

  // Phone number
  phone: {
    type:  String,
    trim:  true,
    default: "",
  },

  // Hashed password — never store plain text
  password: {
    type:     String,
    required: true,
    minlength: 6,
  },

  // Account status
  isActive: {
    type:    Boolean,
    default: true,
  },

  // ── QR Branding fields ────────────────────────────────────────────────────

  // Business phone number for QR vCard (may differ from login phone)
  businessPhone: { type: String, trim: true, default: "" },

  // WhatsApp number in international format (+234...)
  whatsapp:      { type: String, trim: true, default: "" },

  // Instagram handle (with or without @)
  instagram:     { type: String, trim: true, default: "" },

  // Logo file path — stored in /uploads/
  logo:          { type: String, trim: true, default: "" },

  // Short business bio shown on QR dispatch slip
  bio:           { type: String, trim: true, default: "", maxlength: 200 },

}, {
  timestamps: true,
});

// ── Hash password before saving ───────────────────────────────────────────
SellerSchema.pre("save", async function (next) {
  // Only hash if password field was modified
  if (!this.isModified("password")) return next();
  const salt    = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Compare plain password against hash ───────────────────────────────────
SellerSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// ── Never return password in JSON responses ───────────────────────────────
SellerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("Seller", SellerSchema);
