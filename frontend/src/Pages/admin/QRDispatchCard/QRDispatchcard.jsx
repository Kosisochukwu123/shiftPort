/**
 * QRDispatchCard
 * ─────────────────────────────────────────────────────────────────
 * A printable dispatch slip that pops up inside the CreateDispatch
 * success modal. It generates a QR code pointing to the buyer's
 * tracking URL and embeds the seller's branding (logo, business
 * name, WhatsApp, Instagram, phone).
 *
 * Print scope: only .qr-print-area is rendered on paper — everything
 * else (modal chrome, buttons) is hidden via @media print in
 * QRDispatchCard.css.
 *
 * Dependencies:
 *   npm install qrcode
 */

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import "./QRDispatchCard.css";

const API_BASE   = import.meta.env.VITE_API_URL || "http://localhost:5000";
const TRACK_BASE = typeof window !== "undefined" ? window.location.origin : "";

// ── helpers ────────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  return new Date(ts).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Build a vCard 3.0 string that gets encoded into the QR.
 * When scanned on iOS/Android:
 *   • Tracking URL opens in browser
 *   • Contact details can be saved to phone
 */
function buildQRContent({ trackingId, businessName, phone, whatsapp, instagram, trackingUrl }) {
  // Primary payload: the tracking URL — most useful for buyers
  // We embed seller contact in a structured URL fragment so a
  // simple scan opens tracking while the contact data is carried.
  const lines = [
    `BEGIN:VCARD`,
    `VERSION:3.0`,
    `FN:${businessName || "SwiftPort Seller"}`,
    `ORG:${businessName || "SwiftPort Seller"}`,
    phone     ? `TEL;TYPE=CELL:${phone.replace(/\s/g,"")}` : "",
    whatsapp  ? `TEL;TYPE=WORK:${whatsapp.replace(/\s/g,"")}` : "",
    instagram ? `URL:https://instagram.com/${instagram.replace(/^@/,"")}/` : "",
    `URL;TYPE=TRACKING:${trackingUrl}`,
    `NOTE:Track order ${trackingId} at ${trackingUrl}`,
    `END:VCARD`,
  ].filter(Boolean).join("\n");

  return lines;
}

// ── component ──────────────────────────────────────────────────────────────

export default function QRDispatchCard({ dispatch, seller, onClose }) {
  const canvasRef        = useRef(null);
  const [qrReady, setQrReady] = useState(false);
  const [qrError, setQrError] = useState("");

  const trackingId  = dispatch?.trackingId  || "";
  const trackingUrl = `${TRACK_BASE}/track/${trackingId}`;

  // Seller branding fields — fall back gracefully if not yet set
  const businessName = seller?.businessName || seller?.fullName  || "Your Store";
  const phone        = seller?.businessPhone || seller?.phone    || "";
  const whatsapp     = seller?.whatsapp      || phone            || "";
  const instagram    = seller?.instagram     || "";
  const logoSrc      = seller?.logo          ? `${API_BASE}${seller.logo}` : null;
  const bio          = seller?.bio           || "";

  // ── Generate QR code onto canvas ────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !trackingId) return;

    const content = buildQRContent({ trackingId, businessName, phone, whatsapp, instagram, trackingUrl });

    QRCode.toCanvas(canvasRef.current, content, {
      width:            200,
      margin:           1,
      color: {
        dark:  "#0a0a0f",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    }, (err) => {
      if (err) { setQrError("Could not generate QR code."); return; }
      setQrReady(true);
    });
  }, [trackingId, businessName, phone, whatsapp, instagram]);

  // ── Print handler ────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ── Buyer info from dispatch ─────────────────────────────────────────────
  const buyerName    = dispatch?.buyer?.name    || "—";
  const buyerPhone   = dispatch?.buyer?.phone   || "—";
  const courierName  = dispatch?.courier?.name  || "—";
  const courierNo    = dispatch?.courier?.trackingNumber || "";
  const dispatchDate = formatDate(dispatch?.createdAt);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="qr-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="qr-modal">

        {/* ── MODAL HEADER (screen only, hidden on print) ── */}
        <div className="qr-modal-head no-print">
          <div>
            <div className="qr-modal-title">Dispatch Slip</div>
            <div className="qr-modal-sub">Print and attach to your package</div>
          </div>
          <div className="qr-modal-actions">
            <button className="qr-btn-print" onClick={handlePrint}>
              🖨 Print Slip
            </button>
            <button className="qr-btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ── PRINTABLE AREA ── */}
        <div className="qr-print-area">

          {/* Seller header */}
          <div className="qr-seller-header">
            {logoSrc ? (
              <img className="qr-logo" src={logoSrc} alt={`${businessName} logo`}
                onError={e => { e.target.style.display = "none"; }} />
            ) : (
              <div className="qr-logo-initials">
                {businessName.split(" ").slice(0,2).map(w => w[0]?.toUpperCase() || "").join("")}
              </div>
            )}
            <div className="qr-seller-info">
              <div className="qr-seller-name">{businessName}</div>
              {bio && <div className="qr-seller-bio">{bio}</div>}
              <div className="qr-seller-contacts">
                {phone     && <span>📞 {phone}</span>}
                {whatsapp && whatsapp !== phone && <span>💬 {whatsapp}</span>}
                {instagram && <span>📷 {instagram.startsWith("@") ? instagram : `@${instagram}`}</span>}
              </div>
            </div>
            <div className="qr-swiftport-badge">
              <span className="qr-badge-text">Powered by</span>
              <span className="qr-badge-brand">SwiftPort</span>
            </div>
          </div>

          {/* Divider */}
          <div className="qr-divider" />

          {/* Main content: QR + order details */}
          <div className="qr-body">

            {/* Left: QR code */}
            <div className="qr-code-col">
              <div className="qr-canvas-wrap">
                <canvas ref={canvasRef} className={qrReady ? "" : "qr-canvas-loading"} />
                {!qrReady && !qrError && (
                  <div className="qr-generating">Generating…</div>
                )}
                {qrError && <div className="qr-error">{qrError}</div>}
              </div>
              <div className="qr-scan-label">Scan to track order</div>
              <div className="qr-tracking-url">{trackingUrl}</div>
            </div>

            {/* Right: Order details */}
            <div className="qr-details-col">
              <div className="qr-tracking-id-block">
                <div className="qr-detail-eyebrow">Tracking ID</div>
                <div className="qr-tracking-id">{trackingId}</div>
              </div>

              <div className="qr-detail-grid">
                <div className="qr-detail-item">
                  <div className="qr-detail-key">Recipient</div>
                  <div className="qr-detail-val">{buyerName}</div>
                </div>
                <div className="qr-detail-item">
                  <div className="qr-detail-key">Phone</div>
                  <div className="qr-detail-val">{buyerPhone}</div>
                </div>
                <div className="qr-detail-item">
                  <div className="qr-detail-key">Courier</div>
                  <div className="qr-detail-val">{courierName}</div>
                </div>
                {courierNo && (
                  <div className="qr-detail-item">
                    <div className="qr-detail-key">Courier No.</div>
                    <div className="qr-detail-val">{courierNo}</div>
                  </div>
                )}
                <div className="qr-detail-item">
                  <div className="qr-detail-key">Dispatched</div>
                  <div className="qr-detail-val">{dispatchDate}</div>
                </div>
                <div className="qr-detail-item">
                  <div className="qr-detail-key">Seller</div>
                  <div className="qr-detail-val">{businessName}</div>
                </div>
              </div>

              {/* Proof badge */}
              <div className="qr-proof-badge">
                🛡️ Dispatch proof saved · Powered by SwiftPort
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="qr-divider" />

          {/* Footer */}
          <div className="qr-footer">
            <div className="qr-footer-left">
              Scan the QR code to track this order in real time.<br />
              Contact seller: {phone || "via WhatsApp"}{instagram ? ` · ${instagram}` : ""}
            </div>
            <div className="qr-footer-right">
              swiftport.io · Seller Dispatch Proof Platform
            </div>
          </div>

        </div>
        {/* end .qr-print-area */}

        {/* Screen-only action row */}
        <div className="qr-modal-foot no-print">
          <div className="qr-foot-hint">
            💡 Cut along the border and tape to your package, or keep for your records.
          </div>
          <button className="qr-btn-print-full" onClick={handlePrint}>
            🖨 Print Now
          </button>
        </div>

      </div>
    </div>
  );
}
