const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({

  // Linked order
  trackingId: { type: String, required: true, unique: true, index: true },
  sellerId:   { type: String, required: true, index: true },

  // Buyer info (no auth — verified by phone matching the order)
  buyer: {
    name:  { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },

  // Star rating 1–5
  rating: { type: Number, required: true, min: 1, max: 5 },

  // Condition of item received
  itemCondition: {
    type: String,
    enum: ["Perfect condition", "Minor damage", "Significant damage", "Wrong item", "Item missing"],
    required: true,
  },

  // Delivery experience
  deliverySpeed: {
    type: String,
    enum: ["Faster than expected", "On time", "Slightly delayed", "Very delayed"],
    required: true,
  },

  // Free text review
  comment: { type: String, default: "", trim: true, maxlength: 500 },

  // Would they buy again?
  wouldBuyAgain: { type: Boolean, default: true },

  // Confirmed receipt timestamp
  confirmedAt: { type: Date, default: Date.now },

}, { timestamps: true });

module.exports = mongoose.model("Review", ReviewSchema);
