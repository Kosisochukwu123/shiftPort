const express  = require("express");
const router   = express.Router();
const Dispute  = require("../models/Dispute");
const Dispatch = require("../models/Dispatch");
const upload   = require("../middleware/upload");
const { protect } = require("../middleware/auth");

// ── Dispute ID generator ──────────────────────────────────────────────────
function generateDisputeId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const now   = new Date();
  const seg1  = String(now.getFullYear()).slice(-2) +
                String(now.getMonth() + 1).padStart(2, "0");
  const seg2  = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `DSP-${seg1}-${seg2}`;
}

async function uniqueDisputeId() {
  let id, exists;
  do {
    id     = generateDisputeId();
    exists = await Dispute.exists({ disputeId: id });
  } while (exists);
  return id;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/disputes
// 🌐 PUBLIC — buyer opens a new dispute
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", upload.array("evidence", 3), async (req, res) => {
  try {
    const {
      trackingId,
      buyerName,
      buyerPhone,
      buyerEmail,
      reason,
      description,
    } = req.body;

    // Validation
    const missing = [];
    if (!trackingId?.trim())   missing.push("trackingId");
    if (!buyerName?.trim())    missing.push("buyerName");
    if (!buyerPhone?.trim())   missing.push("buyerPhone");
    if (!reason?.trim())       missing.push("reason");
    if (!description?.trim())  missing.push("description");

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    // Verify the dispatch exists
    const dispatch = await Dispatch.findOne({
      trackingId: trackingId.trim().toUpperCase(),
    });

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: `No order found with tracking ID "${trackingId}". Please check and try again.`,
      });
    }

    // Check buyer identity matches (phone must match)
    if (dispatch.buyer.phone !== buyerPhone.trim()) {
      return res.status(403).json({
        success: false,
        message: "Phone number does not match the order. Please use the same number the order was placed with.",
      });
    }

    // Check for existing open dispute on this order
    const existing = await Dispute.findOne({
      trackingId: trackingId.trim().toUpperCase(),
      status:     { $nin: ["Resolved", "Closed"] },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `An open dispute already exists for this order (${existing.disputeId}). Please check your existing dispute.`,
        disputeId: existing.disputeId,
      });
    }

    // Evidence files
    const evidence = (req.files || []).map(f => `/uploads/${f.filename}`);

    // Create dispute
    const disputeId = await uniqueDisputeId();

    const dispute = await Dispute.create({
      disputeId,
      trackingId:  trackingId.trim().toUpperCase(),
      sellerId:    dispatch.sellerId,
      buyer: {
        name:  buyerName.trim(),
        phone: buyerPhone.trim(),
        email: buyerEmail?.trim().toLowerCase() || "",
      },
      reason,
      description: description.trim(),
      evidence,
    });

    // Update dispatch status to "Issue Raised"
    await Dispatch.findOneAndUpdate(
      { trackingId: trackingId.trim().toUpperCase() },
      {
        status: "Issue Raised",
        $push: {
          timeline: {
            status:      "Issue Raised",
            description: `Buyer raised a dispute: "${reason}"`,
            timestamp:   new Date(),
          },
        },
      }
    );

    console.log(`[POST /disputes] Created ${disputeId} for order ${trackingId}`);

    res.status(201).json({
      success: true,
      disputeId: dispute.disputeId,
      dispute,
    });

  } catch (err) {
    console.error("[POST /disputes]", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/disputes
// 🔒 Protected — seller sees all disputes for their orders
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { sellerId: req.seller._id.toString() };
    if (status && status !== "All") filter.status = status;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Dispute.countDocuments(filter);

    const disputes = await Dispute.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v")
      .lean();

    // Unread count
    const unread = await Dispute.countDocuments({
      sellerId:       req.seller._id.toString(),
      "isRead.seller": false,
      status:         { $nin: ["Resolved", "Closed"] },
    });

    res.json({
      success: true,
      count:   disputes.length,
      total,
      unread,
      pages:   Math.ceil(total / parseInt(limit)),
      disputes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/disputes/:disputeId
// Used by both seller (protected) and buyer (public with phone verification)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:disputeId", async (req, res) => {
  try {
    const id       = req.params.disputeId.toUpperCase().trim();
    const { phone } = req.query; // buyer provides phone to verify

    const dispute = await Dispute.findOne({ disputeId: id }).lean();

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: `Dispute "${id}" not found.`,
      });
    }

    // Access control: either authenticated seller OR buyer with matching phone
    const authHeader = req.headers.authorization;
    const isSellerRequest = !!authHeader;

    if (!isSellerRequest) {
      // Public buyer access — must verify phone
      if (!phone) {
        return res.status(401).json({
          success: false,
          message: "Please provide your phone number to view this dispute.",
        });
      }
      if (dispute.buyer.phone !== phone.trim()) {
        return res.status(403).json({
          success: false,
          message: "Phone number does not match this dispute.",
        });
      }
      // Mark as read for buyer
      await Dispute.updateOne({ disputeId: id }, { "isRead.buyer": true });
    }

    res.json({ success: true, dispute });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/disputes/:disputeId/reply
// 🔒 Protected — seller replies to dispute
// ─────────────────────────────────────────────────────────────────────────────
router.post("/:disputeId/reply", protect, upload.array("attachments", 3), async (req, res) => {
  try {
    const id   = req.params.disputeId.toUpperCase().trim();
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: "Reply text is required." });
    }

    const attachments = (req.files || []).map(f => `/uploads/${f.filename}`);

    const dispute = await Dispute.findOneAndUpdate(
      { disputeId: id, sellerId: req.seller._id.toString() },
      {
        status: "Seller Responded",
        "isRead.seller": true,
        "isRead.buyer":  false,
        $push: {
          messages: {
            from:      "seller",
            fromName:  req.seller.businessName || req.seller.fullName,
            text:      text.trim(),
            attachments,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found or does not belong to you." });
    }

    console.log(`[POST /disputes/${id}/reply] Seller replied`);
    res.json({ success: true, dispute });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/disputes/:disputeId/buyer-reply
// 🌐 PUBLIC — buyer adds a follow-up message (verified by phone)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/:disputeId/buyer-reply", upload.array("attachments", 3), async (req, res) => {
  try {
    const id   = req.params.disputeId.toUpperCase().trim();
    const { text, buyerPhone } = req.body;

    if (!text?.trim())       return res.status(400).json({ success: false, message: "Message text is required."    });
    if (!buyerPhone?.trim()) return res.status(400).json({ success: false, message: "Phone verification required." });

    const dispute = await Dispute.findOne({ disputeId: id });
    if (!dispute)                               return res.status(404).json({ success: false, message: "Dispute not found."             });
    if (dispute.buyer.phone !== buyerPhone.trim()) return res.status(403).json({ success: false, message: "Phone does not match dispute." });

    const attachments = (req.files || []).map(f => `/uploads/${f.filename}`);

    dispute.isRead.seller = false;
    dispute.isRead.buyer  = true;
    dispute.messages.push({
      from:      "buyer",
      fromName:  dispute.buyer.name,
      text:      text.trim(),
      attachments,
      timestamp: new Date(),
    });
    await dispute.save();

    res.json({ success: true, dispute });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/disputes/:disputeId/resolve
// 🔒 Protected — seller resolves or closes a dispute
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/:disputeId/resolve", protect, async (req, res) => {
  try {
    const id = req.params.disputeId.toUpperCase().trim();
    const { outcome, notes } = req.body;

    const validOutcomes = ["Refund issued", "Reshipped", "Resolved — item delivered", "Rejected", "No action required"];
    if (!outcome || !validOutcomes.includes(outcome)) {
      return res.status(400).json({
        success: false,
        message: `Invalid outcome. Must be one of: ${validOutcomes.join(", ")}`,
      });
    }

    const dispute = await Dispute.findOneAndUpdate(
      { disputeId: id, sellerId: req.seller._id.toString() },
      {
        status: "Resolved",
        "resolution.outcome":    outcome,
        "resolution.notes":      notes?.trim() || "",
        "resolution.resolvedAt": new Date(),
        "resolution.resolvedBy": "seller",
        "isRead.seller":         true,
        $push: {
          messages: {
            from:      "system",
            fromName:  "SwiftPort",
            text:      `Dispute resolved by seller. Outcome: "${outcome}"${notes ? `. Notes: ${notes}` : ""}.`,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found or does not belong to you." });
    }

    // Update dispatch status back from Issue Raised if resolved
    await Dispatch.findOneAndUpdate(
      { trackingId: dispute.trackingId },
      {
        $push: {
          timeline: {
            status:      "Dispatched",
            description: `Dispute resolved: "${outcome}"`,
            timestamp:   new Date(),
          },
        },
      }
    );

    console.log(`[PATCH /disputes/${id}/resolve] Outcome: ${outcome}`);
    res.json({ success: true, dispute });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/disputes/order/:trackingId
// 🌐 PUBLIC — buyer checks if a dispute exists for their order
// ─────────────────────────────────────────────────────────────────────────────
router.get("/order/:trackingId", async (req, res) => {
  try {
    const id      = req.params.trackingId.toUpperCase().trim();
    const dispute = await Dispute.findOne({
      trackingId: id,
      status:     { $nin: ["Resolved", "Closed"] },
    }).select("disputeId status createdAt reason").lean();

    res.json({ success: true, dispute: dispute || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
