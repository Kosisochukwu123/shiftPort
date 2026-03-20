const express  = require("express");
const router   = express.Router();
const Review   = require("../models/Review");
const Dispatch = require("../models/Dispatch");
const { protect } = require("../middleware/auth");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reviews/confirm/:trackingId
// 🌐 PUBLIC — buyer confirms they received the order
// Verified by matching phone number
// ─────────────────────────────────────────────────────────────────────────────
router.post("/confirm/:trackingId", async (req, res) => {
  try {
    const id    = req.params.trackingId.toUpperCase().trim();
    const { buyerPhone } = req.body;

    if (!buyerPhone?.trim()) {
      return res.status(400).json({ success: false, message: "Phone number required to confirm receipt." });
    }

    const dispatch = await Dispatch.findOne({ trackingId: id });

    if (!dispatch) {
      return res.status(404).json({ success: false, message: `Order "${id}" not found.` });
    }

    // Verify buyer phone
    if (dispatch.buyer.phone !== buyerPhone.trim()) {
      return res.status(403).json({
        success: false,
        message: "Phone number does not match this order.",
      });
    }

    // Only allow confirmation if status is appropriate
    if (dispatch.status === "Delivered") {
      return res.status(409).json({
        success: false,
        message: "This order has already been confirmed as delivered.",
        alreadyConfirmed: true,
      });
    }

    // Update dispatch status to Delivered + add timeline event
    dispatch.status = "Delivered";
    dispatch.timeline.push({
      status:      "Delivered",
      description: `Buyer ${dispatch.buyer.name} confirmed receipt of this order.`,
      timestamp:   new Date(),
    });
    await dispatch.save();

    console.log(`[confirm-receipt] ${id} confirmed by buyer`);

    res.json({
      success: true,
      message: "Receipt confirmed. Thank you!",
      trackingId: id,
    });

  } catch (err) {
    console.error("[POST /confirm]", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reviews
// 🌐 PUBLIC — buyer submits a review after confirming receipt
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const {
      trackingId,
      buyerPhone,
      rating,
      itemCondition,
      deliverySpeed,
      comment,
      wouldBuyAgain,
    } = req.body;

    // Validation
    const missing = [];
    if (!trackingId)    missing.push("trackingId");
    if (!buyerPhone)    missing.push("buyerPhone");
    if (!rating)        missing.push("rating");
    if (!itemCondition) missing.push("itemCondition");
    if (!deliverySpeed) missing.push("deliverySpeed");
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    const id = trackingId.trim().toUpperCase();

    // Verify the dispatch exists and phone matches
    const dispatch = await Dispatch.findOne({ trackingId: id });
    if (!dispatch) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    if (dispatch.buyer.phone !== buyerPhone.trim()) {
      return res.status(403).json({ success: false, message: "Phone number does not match this order." });
    }

    // Must be confirmed as delivered first
    if (dispatch.status !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "You can only leave a review after confirming receipt of your order.",
      });
    }

    // Only one review per order
    const existing = await Review.findOne({ trackingId: id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a review for this order.",
        review: existing,
      });
    }

    // Create review
    const review = await Review.create({
      trackingId:   id,
      sellerId:     dispatch.sellerId,
      buyer: {
        name:  dispatch.buyer.name,
        phone: dispatch.buyer.phone,
      },
      rating:        parseInt(rating, 10),
      itemCondition,
      deliverySpeed,
      comment:       comment?.trim() || "",
      wouldBuyAgain: wouldBuyAgain !== false && wouldBuyAgain !== "false",
    });

    console.log(`[POST /reviews] Review created for ${id} — ${rating}★`);

    res.status(201).json({ success: true, review });

  } catch (err) {
    console.error("[POST /reviews]", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reviews/order/:trackingId
// 🌐 PUBLIC — get review for a specific order (to show on tracking page)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/order/:trackingId", async (req, res) => {
  try {
    const id     = req.params.trackingId.toUpperCase().trim();
    const review = await Review.findOne({ trackingId: id }).lean();
    res.json({ success: true, review: review || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reviews/seller
// 🔒 Protected — seller sees all their reviews + aggregated stats
// ─────────────────────────────────────────────────────────────────────────────
router.get("/seller", protect, async (req, res) => {
  try {
    const sellerId = req.seller._id.toString();

    const reviews = await Review.find({ sellerId })
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate stats
    const total     = reviews.length;
    const avgRating = total > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
      : 0;

    const distribution = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: reviews.filter(r => r.rating === star).length,
      pct:   total > 0
        ? Math.round(reviews.filter(r => r.rating === star).length / total * 100)
        : 0,
    }));

    const wouldBuyAgainPct = total > 0
      ? Math.round(reviews.filter(r => r.wouldBuyAgain).length / total * 100)
      : 0;

    res.json({
      success: true,
      stats: { total, avgRating: parseFloat(avgRating), distribution, wouldBuyAgainPct },
      reviews,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;
