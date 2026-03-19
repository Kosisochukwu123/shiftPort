const express  = require("express");
const router   = express.Router();
const Dispatch = require("../models/Dispatch");
const upload   = require("../middleware/upload");
const { protect } = require("../middleware/auth");
const { sendTrackingEmail, sendDeliveryConfirmedEmail } = require("../middleware/emailService");

// ── Tracking ID generator ─────────────────────────────────────────────────
function generateTrackingId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const now   = new Date();
  const seg1  = String(now.getFullYear()).slice(-2) +
                String(now.getMonth() + 1).padStart(2, "0");
  const seg2  = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `TRK-${seg1}-${seg2}`;
}

async function uniqueTrackingId() {
  let id, exists;
  do {
    id     = generateTrackingId();
    exists = await Dispatch.exists({ trackingId: id });
  } while (exists);
  return id;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dispatches
// 🔒 Protected — seller creates a new dispatch
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", protect, upload.single("waybill"), async (req, res) => {
  try {
    console.log("[POST /api/dispatches] seller:", req.seller.email);

    const {
      customerName,
      customerPhone,
      customerEmail,
      courier,
      courierTrackingNumber,
      notes,
    } = req.body;

    // Validation
    const missing = [];
    if (!customerName?.trim())  missing.push("customerName");
    if (!customerPhone?.trim()) missing.push("customerPhone");
    if (!courier?.trim())       missing.push("courier");
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Waybill image or PDF is required.",
      });
    }

    const trackingId = await uniqueTrackingId();
    const waybillUrl = `/uploads/${req.file.filename}`;

    // Save with seller reference
    const dispatch = await Dispatch.create({
      trackingId,
      sellerId:    req.seller._id.toString(),
      sellerEmail: req.seller.email,
      sellerName:  req.seller.businessName || req.seller.fullName,
      buyer: {
        name:  customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail ? customerEmail.trim().toLowerCase() : "",
      },
      courier: {
        name:           courier.trim(),
        trackingNumber: courierTrackingNumber?.trim() || "",
      },
      waybillUrl,
      waybillFilename: req.file.originalname,
      notes: notes?.trim() || "",
    });

    // Tracking & WhatsApp URLs
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const trackingUrl = `${frontendUrl}/track/${trackingId}`;
    const waText      = encodeURIComponent(
      `Hi ${customerName.trim()}! 🎉 Your order has been dispatched by ${req.seller.businessName}.\n\n` +
      `Tracking ID: *${trackingId}*\n\n` +
      `Track your order here 👇\n${trackingUrl}\n\n` +
      `— Sent via SwiftPort`
    );
    const whatsappUrl = `https://wa.me/?text=${waText}`;

    // Email notification
    let emailResult = { sent: false };
    if (customerEmail?.trim()) {
      emailResult = await sendTrackingEmail({
        buyerEmail:  customerEmail.trim(),
        buyerName:   customerName.trim(),
        sellerName:  req.seller.businessName,
        trackingId,
        trackingUrl,
        courier:     courier.trim(),
      });
      if (emailResult.sent) {
        await Dispatch.updateOne({ trackingId }, { "notifications.buyerEmailSent": true });
      }
    }

    console.log(`[POST /api/dispatches] ✅ Created ${trackingId} by ${req.seller.email}`);

    res.status(201).json({
      success: true,
      trackingId,
      trackingUrl,
      whatsappUrl,
      dispatch,
      emailSent: emailResult.sent,
    });

  } catch (err) {
    console.error("[POST /api/dispatches]", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dispatches
// 🔒 Protected — seller sees ONLY their own dispatches
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    // Filter by this seller only
    const filter = { sellerId: req.seller._id.toString() };
    if (status && status !== "All") filter.status = status;
    if (search) {
      filter.$or = [
        { trackingId:   { $regex: search, $options: "i" } },
        { "buyer.name": { $regex: search, $options: "i" } },
        { "buyer.phone":{ $regex: search, $options: "i" } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Dispatch.countDocuments(filter);
    const dispatches = await Dispatch.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v")
      .lean();

    res.json({
      success: true,
      count:   dispatches.length,
      total,
      page:    parseInt(page),
      pages:   Math.ceil(total / parseInt(limit)),
      dispatches,
    });

  } catch (err) {
    console.error("[GET /api/dispatches]", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dispatches/track/:trackingId/dispute
// 🌐 PUBLIC — buyer files a formal "item not received" dispute
// ─────────────────────────────────────────────────────────────────────────────
router.post("/track/:trackingId/dispute", async (req, res) => {
  try {
    const id      = req.params.trackingId.toUpperCase().trim();
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please describe the issue before submitting.",
      });
    }

    const dispatch = await Dispatch.findOne({ trackingId: id });

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: `No order found with tracking ID "${id}".`,
      });
    }

    // Already delivered — can't dispute
    if (dispatch.status === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "This order has already been confirmed as delivered and cannot be disputed.",
      });
    }

    // Already has an open dispute — idempotent
    if (dispatch.dispute?.status === "open") {
      return res.json({
        success: true,
        alreadyOpen: true,
        message: "A dispute is already open for this order. Your seller has been notified.",
      });
    }

    // File the dispute
    dispatch.dispute = {
      status:      "open",
      buyerMessage: message.trim(),
      filedAt:     new Date(),
      sellerResponse: "",
      respondedAt: null,
    };

    // Update order status to "Issue Raised" and add timeline event
    dispatch.status = "Issue Raised";
    dispatch.timeline.push({
      status:      "Issue Raised",
      description: `Buyer raised a dispute: "${message.trim().slice(0, 120)}${message.length > 120 ? "…" : ""}"`,
      timestamp:   new Date(),
    });

    await dispatch.save();

    console.log(`[POST /track/${id}/dispute] ⚠️ Dispute filed`);

    // Notify seller (non-blocking)
    try {
      if (dispatch.sellerEmail) {
        const frontendUrl  = process.env.FRONTEND_URL || "http://localhost:5173";
        const dashboardUrl = `${frontendUrl}/dashboard`;

        await sendDisputeNotificationEmail({
          sellerEmail:  dispatch.sellerEmail,
          sellerName:   dispatch.sellerName,
          buyerName:    dispatch.buyer.name,
          trackingId:   dispatch.trackingId,
          buyerMessage: message.trim(),
          dashboardUrl,
        });
      }
    } catch (emailErr) {
      console.error("[dispute] Email notification failed:", emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Dispute filed. Your seller has been notified and will respond shortly.",
    });

  } catch (err) {
    console.error("[POST /dispute]", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dispatches/:trackingId/dispute/respond
// 🔒 Protected — seller responds to an open dispute
// ─────────────────────────────────────────────────────────────────────────────
router.post("/:trackingId/dispute/respond", protect, async (req, res) => {
  try {
    const id       = req.params.trackingId.toUpperCase().trim();
    const { response, resolution } = req.body;
    // resolution: "resolved" | "investigating" (optional, defaults to seller_responded)

    if (!response?.trim()) {
      return res.status(400).json({
        success: false,
        message: "A response message is required.",
      });
    }

    const dispatch = await Dispatch.findOne({
      trackingId: id,
      sellerId:   req.seller._id.toString(),
    });

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: `Dispatch "${id}" not found or does not belong to your account.`,
      });
    }

    if (!dispatch.dispute || dispatch.dispute.status === "none") {
      return res.status(400).json({
        success: false,
        message: "No open dispute found for this order.",
      });
    }

    // Update dispute
    dispatch.dispute.sellerResponse = response.trim();
    dispatch.dispute.respondedAt    = new Date();
    dispatch.dispute.status         = resolution === "resolved" ? "resolved" : "seller_responded";

    // If seller marks as resolved, update order status back to Delivered
    if (resolution === "resolved") {
      dispatch.status = "Delivered";
      dispatch.timeline.push({
        status:      "Delivered",
        description: `Seller resolved the dispute: "${response.trim().slice(0, 120)}${response.length > 120 ? "…" : ""}"`,
        timestamp:   new Date(),
      });
    } else {
      dispatch.timeline.push({
        status:      "Issue Raised",
        description: `Seller responded to dispute: "${response.trim().slice(0, 120)}${response.length > 120 ? "…" : ""}"`,
        timestamp:   new Date(),
      });
    }

    await dispatch.save();

    console.log(`[POST /${id}/dispute/respond] 💬 Seller responded`);

    res.json({
      success: true,
      message: "Your response has been recorded.",
      dispute: dispatch.dispute,
    });

  } catch (err) {
    console.error("[POST /dispute/respond]", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dispatches/track/:trackingId
// 🌐 PUBLIC — buyer tracks their order (no auth needed)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/track/:trackingId", async (req, res) => {
  try {
    const id = req.params.trackingId.toUpperCase().trim();
    console.log(`[GET /track/${id}] public lookup`);

    const dispatch = await Dispatch.findOne({ trackingId: id }).lean();

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: `No order found with tracking ID "${id}". Please check and try again.`,
      });
    }

    // Public view — only safe fields
    const publicData = {
      trackingId:  dispatch.trackingId,
      status:      dispatch.status,
      sellerName:  dispatch.sellerName,
      courier:     dispatch.courier,
      waybillUrl:  dispatch.waybillUrl,
      timeline:    dispatch.timeline,
      createdAt:   dispatch.createdAt,
      updatedAt:   dispatch.updatedAt,
      buyer: { name: dispatch.buyer.name },
    };

    res.json({ success: true, dispatch: publicData });
  } catch (err) {
    console.error("[GET /track/:id]", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dispatches/track/:trackingId/confirm-delivery
// 🌐 PUBLIC — buyer confirms they received their order
// ─────────────────────────────────────────────────────────────────────────────
router.post("/track/:trackingId/confirm-delivery", async (req, res) => {
  try {
    const id = req.params.trackingId.toUpperCase().trim();
    console.log(`[POST /track/${id}/confirm-delivery] buyer confirmation`);

    const dispatch = await Dispatch.findOne({ trackingId: id });

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: `No order found with tracking ID "${id}".`,
      });
    }

    // Already confirmed — idempotent, just return success
    if (dispatch.status === "Delivered") {
      return res.json({
        success: true,
        alreadyConfirmed: true,
        message: "This order has already been marked as delivered.",
      });
    }

    // Update status and push timeline event
    dispatch.status = "Delivered";
    dispatch.timeline.push({
      status:      "Delivered",
      description: "Buyer confirmed receipt of this order. ✅",
      timestamp:   new Date(),
    });
    await dispatch.save();

    console.log(`[POST /track/${id}/confirm-delivery] ✅ Marked as Delivered`);

    // Notify seller via email (non-blocking — don't fail the response if email fails)
    try {
      if (dispatch.sellerEmail) {
        const frontendUrl   = process.env.FRONTEND_URL || "http://localhost:5173";
        const dashboardUrl  = `${frontendUrl}/dashboard`;

        await sendDeliveryConfirmedEmail({
          sellerEmail:  dispatch.sellerEmail,
          sellerName:   dispatch.sellerName,
          buyerName:    dispatch.buyer.name,
          trackingId:   dispatch.trackingId,
          dashboardUrl,
        });

        console.log(`[POST /track/${id}/confirm-delivery] 📧 Seller notified at ${dispatch.sellerEmail}`);
      }
    } catch (emailErr) {
      // Email failure should NOT block the buyer's confirmation
      console.error("[confirm-delivery] Email notification failed:", emailErr.message);
    }

    res.json({
      success: true,
      message: "Delivery confirmed. Thank you!",
    });

  } catch (err) {
    console.error("[POST /confirm-delivery]", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dispatches/:trackingId
// 🔒 Protected — seller views full detail of one of their dispatches
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:trackingId", protect, async (req, res) => {
  try {
    const id = req.params.trackingId.toUpperCase().trim();

    const dispatch = await Dispatch.findOne({
      trackingId: id,
      sellerId:   req.seller._id.toString(), // must belong to this seller
    }).lean();

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: `Dispatch "${id}" not found.`,
      });
    }

    res.json({ success: true, dispatch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/dispatches/:trackingId/status
// 🔒 Protected — seller updates order status + adds timeline event
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/:trackingId/status", protect, async (req, res) => {
  try {
    const { status, description, location } = req.body;
    const id = req.params.trackingId.toUpperCase().trim();

    const validStatuses = [
      "Dispatched", "On the Way", "Out for Delivery", "Delivered", "Issue Raised",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const dispatch = await Dispatch.findOneAndUpdate(
      { trackingId: id, sellerId: req.seller._id.toString() },
      {
        status,
        $push: {
          timeline: {
            status,
            description: description?.trim() || `Order status updated to: ${status}`,
            location:    location?.trim() || "",
            timestamp:   new Date(),
          },
        },
      },
      { new: true }
    );

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: `Dispatch "${id}" not found or does not belong to your account.`,
      });
    }

    console.log(`[PATCH /${id}/status] → ${status} by ${req.seller.email}`);
    res.json({ success: true, dispatch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
