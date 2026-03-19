const mongoose = require("mongoose");

// ── Message in the dispute thread ────────────────────────────────────────
const MessageSchema = new mongoose.Schema({
  from:       { type: String, enum: ["buyer", "seller", "system"], required: true },
  fromName:   { type: String, default: "" },
  text:       { type: String, required: true, trim: true },
  attachments:{ type: [String], default: [] }, // file paths
  timestamp:  { type: Date, default: Date.now },
}, { _id: false });

// ── Main Dispute schema ───────────────────────────────────────────────────
const DisputeSchema = new mongoose.Schema({

  // Human-readable ID e.g. DSP-2603-A1B2
  disputeId: {
    type:   String,
    unique: true,
    index:  true,
  },

  // Linked dispatch
  trackingId: { type: String, required: true, index: true },
  sellerId:   { type: String, required: true, index: true },

  // Buyer who raised it (stored at creation — no auth for buyer)
  buyer: {
    name:  { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
  },

  // Dispute details
  reason: {
    type: String,
    enum: [
      "Item not received",
      "Item damaged",
      "Wrong item sent",
      "Partial order",
      "Delayed delivery",
      "Other",
    ],
    required: true,
  },

  description: { type: String, required: true, trim: true },

  // Evidence uploaded by buyer (file paths)
  evidence: { type: [String], default: [] },

  // Status
  status: {
    type:    String,
    enum:    ["Open", "Seller Responded", "Under Review", "Resolved", "Closed"],
    default: "Open",
  },

  // Resolution
  resolution: {
    outcome:   { type: String, default: "" }, // "Refund issued", "Reshipped", "Rejected", "No action"
    notes:     { type: String, default: "" },
    resolvedAt:{ type: Date },
    resolvedBy:{ type: String, default: "seller" },
  },

  // Message thread
  messages: { type: [MessageSchema], default: [] },

  // Flags
  isRead: {
    seller: { type: Boolean, default: false },
    buyer:  { type: Boolean, default: false },
  },

}, { timestamps: true });

// ── Auto-add system message on creation ──────────────────────────────────
DisputeSchema.pre("save", function (next) {
  if (this.isNew && this.messages.length === 0) {
    this.messages.push({
      from:      "system",
      fromName:  "SwiftPort",
      text:      `Dispute opened by ${this.buyer.name}. Reason: "${this.reason}". The seller has been notified.`,
      timestamp: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model("Dispute", DisputeSchema);
