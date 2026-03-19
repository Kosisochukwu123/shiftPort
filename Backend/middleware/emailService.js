const nodemailer = require("nodemailer");

// ── Transporter ───────────────────────────────────────────────────────────
// Uses Gmail + App Password. Swap for SendGrid/Mailgun in production.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Email template ────────────────────────────────────────────────────────
function buildTrackingEmail({ buyerName, sellerName, trackingId, trackingUrl, courier }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your order has been dispatched</title>
</head>
<body style="margin:0;padding:0;background:#edeae3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#edeae3;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header -->
        <tr>
          <td style="background:#0a0a0f;padding:24px 32px;">
            <div style="font-size:20px;font-weight:800;color:#f5f3ee;letter-spacing:-0.03em;">
              Swift<span style="color:#c84b2f;">Port</span>
            </div>
            <div style="font-family:monospace;font-size:11px;color:#44495e;letter-spacing:0.1em;margin-top:4px;text-transform:uppercase;">
              Dispatch Notification
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px;">
            <p style="font-size:22px;font-weight:800;color:#0a0a0f;letter-spacing:-0.03em;margin:0 0 8px;">
              Your order is on its way! 📦
            </p>
            <p style="font-size:14px;color:#8a8478;margin:0 0 28px;line-height:1.6;">
              Hi <strong style="color:#0a0a0f;">${buyerName}</strong>,
              <strong style="color:#0a0a0f;">${sellerName || "Your seller"}</strong>
              has dispatched your order via <strong style="color:#0a0a0f;">${courier}</strong>.
              Use the tracking ID below to follow your delivery.
            </p>

            <!-- Tracking ID box -->
            <div style="background:#f5f3ee;border:1.5px solid #e8e6e0;padding:20px 24px;text-align:center;margin-bottom:24px;">
              <div style="font-family:monospace;font-size:11px;color:#8a8478;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:8px;">
                Your Tracking ID
              </div>
              <div style="font-family:monospace;font-size:28px;font-weight:700;color:#c84b2f;letter-spacing:0.12em;">
                ${trackingId}
              </div>
            </div>

            <!-- CTA button -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${trackingUrl}"
                style="display:inline-block;background:#c84b2f;color:#ffffff;font-size:15px;font-weight:800;padding:14px 36px;text-decoration:none;letter-spacing:0.03em;">
                Track My Order →
              </a>
            </div>

            <p style="font-size:12px;color:#8a8478;text-align:center;line-height:1.6;margin:0;">
              Or copy this link into your browser:<br/>
              <a href="${trackingUrl}" style="color:#c84b2f;word-break:break-all;">${trackingUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0a0a0f;padding:18px 32px;">
            <p style="font-family:monospace;font-size:10px;color:#44495e;letter-spacing:0.08em;margin:0;text-align:center;">
              Powered by SwiftPort · The easiest way for Nigerian sellers to prove they shipped.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

// ── Send tracking email ───────────────────────────────────────────────────
async function sendTrackingEmail({ buyerEmail, buyerName, sellerName, trackingId, trackingUrl, courier }) {
  if (!buyerEmail) return { sent: false, reason: "No buyer email provided" };
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[Email] EMAIL_USER or EMAIL_PASS not set — skipping email.");
    return { sent: false, reason: "Email credentials not configured" };
  }

  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to:      buyerEmail,
      subject: `📦 Your order has been dispatched — Track ID: ${trackingId}`,
      html:    buildTrackingEmail({ buyerName, sellerName, trackingId, trackingUrl, courier }),
    });
    console.log(`[Email] Sent to ${buyerEmail} for tracking ${trackingId}`);
    return { sent: true };
  } catch (err) {
    console.error("[Email] Failed:", err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendTrackingEmail };
