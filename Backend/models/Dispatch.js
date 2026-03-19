const mongoose = require("mongoose");

// ── Tracking event sub-schema ─────────────────────────────────────────────
const TrackingEventSchema = new mongoose.Schema({
  status:      { type: String, required: true },
  description: { type: String, required: true },
  location:    { type: String, default: "" },
  timestamp:   { type: Date,   default: Date.now },
}, { _id: false });

// ── Dispute sub-schema ────────────────────────────────────────────────────
const DisputeSchema = new mongoose.Schema({
  status: {
    type:    String,
    enum:    ["none", "open", "seller_responded", "resolved"],
    default: "none",
  },
  buyerMessage:    { type: String, default: "" },
  sellerResponse:  { type: String, default: "" },
  filedAt:         { type: Date,   default: null },
  respondedAt:     { type: Date,   default: null },
}, { _id: false });

// ── Main Dispatch schema ──────────────────────────────────────────────────
const DispatchSchema = new mongoose.Schema({

  // The unique tracking ID shown publicly — TRK-2603-A7F3K2
  trackingId: {
    type:     String,
    required: true,
    unique:   true,
    index:    true,
  },

  // Seller who created this dispatch
  sellerId: {
    type: String,
    default: "default",
  },
  sellerName: {
    type: String,
    default: "",
  },
  sellerEmail: {
    type: String,
    default: "",
  },

  // Buyer details
  buyer: {
    name:  { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
  },

  // Courier details
  courier: {
    name:           { type: String, required: true },
    trackingNumber: { type: String, default: "" },
  },

  // Waybill image/pdf
  waybillUrl:      { type: String, default: "" },
  waybillFilename: { type: String, default: "" },

  // Order status
  status: {
    type:    String,
    enum:    ["Dispatched", "On the Way", "Out for Delivery", "Delivered", "Issue Raised"],
    default: "Dispatched",
  },

  // Timeline of status events
  timeline: {
    type:    [TrackingEventSchema],
    default: [],
  },

  // Dispute — buyer can file one formal dispute per order
  dispute: {
    type:    DisputeSchema,
    default: () => ({ status: "none" }),
  },

  // Notification flags
  notifications: {
    buyerEmailSent: { type: Boolean, default: false },
    buyerSmsSent:   { type: Boolean, default: false },
  },

  notes: { type: String, default: "" },

}, {
  timestamps: true,
});

// ── Auto-add "Dispatched" event on creation ───────────────────────────────
DispatchSchema.pre("save", function (next) {
  if (this.isNew && this.timeline.length === 0) {
    this.timeline.push({
      status:      "Dispatched",
      description: "Seller has dispatched this order and uploaded proof of dispatch.",
      timestamp:   new Date(),
    });
  }
  next();
});

module.exports = mongoose.model("Dispatch", DispatchSchema);
