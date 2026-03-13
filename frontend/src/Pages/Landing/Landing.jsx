import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

const STEPS = [
  { num: "01", icon: "◈", title: "Book a Shipment",     desc: "Enter sender and recipient details, choose your package size and preferred carrier in minutes." },
  { num: "02", icon: "⬡", title: "We Handle Pickup",    desc: "Your chosen carrier collects the package directly from your door at a scheduled time." },
  { num: "03", icon: "◎", title: "Real-Time Tracking",  desc: "Follow your shipment live on a map with milestone notifications at every step." },
  { num: "04", icon: "✓", title: "Delivered & Confirmed", desc: "Receive proof of delivery with timestamp, signature, and photo confirmation." },
];

const FEATURES = [
  { icon: "◎", title: "Live Tracking",         desc: "Follow every shipment in real time with route maps, milestone alerts, and estimated delivery windows." },
  { icon: "◈", title: "Multi-Carrier Support", desc: "DHL, FedEx, and UPS all in one place. Compare rates and choose the best option for every shipment." },
  { icon: "⬡", title: "Instant Quotes",        desc: "Get accurate shipping quotes in seconds. No hidden fees, no surprises at checkout." },
  { icon: "🔔", title: "Smart Notifications",  desc: "SMS and email alerts for pickup, transit updates, customs clearance, and final delivery." },
  { icon: "◧", title: "Shipment History",      desc: "Access every shipment you've ever made — invoices, labels, tracking records — all in one place." },
  { icon: "⊕", title: "Address Book",          desc: "Save your frequently used sender and recipient addresses for lightning-fast repeat bookings." },
];

const CARRIERS = ["DHL Express", "FedEx International", "UPS Worldwide", "EMS Speed Post", "Aramex Global"];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div>

      {/* ── NAV ── */}
      <nav className={`land-nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-brand" onClick={() => navigate("/")}>
          <div className="nav-brand-mark">
            <svg viewBox="0 0 24 24">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
            </svg>
          </div>
          <div>
            <div className="nav-brand-name">Swift<span>Port</span></div>
          </div>
        </div>

        <div className="nav-links">
          <button className="nav-link" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>How it works</button>
          <button className="nav-link" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Features</button>
          <button className="nav-link" onClick={() => document.getElementById("carriers")?.scrollIntoView({ behavior: "smooth" })}>Carriers</button>
        </div>

        <div className="nav-ctas">
          <button className="btn-nav-login" onClick={() => navigate("/login")}>Sign In</button>
          <button className="btn-nav-cta"   onClick={() => navigate("/portal/signup")}>Get Started →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="land-hero">
        <div className="hero-glow" />

        <div className="hero-eyebrow">Trusted by 12,000+ businesses across Africa</div>

        <h1 className="hero-title">
          Ship anything,<br />
          <em>anywhere.</em>
        </h1>

        <p className="hero-sub">
          SwiftPort connects you to the world's leading carriers — DHL, FedEx, UPS — with real-time tracking, instant quotes, and doorstep pickup. All in one platform.
        </p>

        <div className="hero-ctas">
          <button className="btn-hero-primary" onClick={() => navigate("/portal/signup")}>
            Start Shipping Free →
          </button>
          <button className="btn-hero-secondary" onClick={() => navigate("/portal/track")}>
            Track a Shipment
          </button>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-val"><span>4,821</span></div>
            <div className="hero-stat-label">Shipments this month</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val"><span>94.2%</span></div>
            <div className="hero-stat-label">On-time delivery</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val"><span>3</span></div>
            <div className="hero-stat-label">Carrier partners</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val"><span>180+</span></div>
            <div className="hero-stat-label">Countries covered</div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="land-how" id="how">
        <div className="section-eyebrow">How it works</div>
        <h2 className="section-title">Four steps to<br /><em>delivered.</em></h2>
        <p className="section-sub">From booking to doorstep — SwiftPort handles every step of the journey so you don't have to.</p>

        <div className="steps-grid">
          {STEPS.map(s => (
            <div key={s.num} className="step-card">
              <div className="step-num">{s.num}</div>
              <div className="step-icon">{s.icon}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
              <div className="step-accent" />
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="land-features" id="features">
        <div className="section-eyebrow" style={{ color: "#c84b2f" }}>Why SwiftPort</div>
        <h2 className="section-title" style={{ color: "#f5f3ee" }}>
          Everything you need<br />
          <em>to ship with confidence.</em>
        </h2>
        <p className="section-sub" style={{ color: "#6a6a80" }}>
          Built for businesses that ship regularly. Powerful enough for logistics teams, simple enough for anyone.
        </p>

        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CARRIERS ── */}
      <section className="land-carriers" id="carriers">
        <div className="section-eyebrow">Our partners</div>
        <h2 className="section-title">Powered by the<br /><em>world's best carriers.</em></h2>
        <div className="carriers-row">
          {CARRIERS.map(c => (
            <div key={c} className="carrier-badge">{c}</div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="land-cta">
        <h2 className="cta-title">Ready to start<br />shipping smarter?</h2>
        <p className="cta-sub">Join 12,000+ businesses already using SwiftPort. No contracts, no setup fees.</p>
        <button className="btn-cta-white" onClick={() => navigate("/portal/signup")}>
          Create Free Account →
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="land-footer">
        <div className="footer-top">
          <div>
            <div className="nav-brand">
              <div className="nav-brand-mark">
                <svg viewBox="0 0 24 24">
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
                </svg>
              </div>
              <div className="nav-brand-name" style={{ color: "#f5f3ee" }}>Swift<span>Port</span></div>
            </div>
            <p className="footer-brand-desc">
              The complete logistics platform for modern businesses. Real-time tracking, multi-carrier support, and powerful tools — all in one place.
            </p>
          </div>
          <div>
            <div className="footer-col-title">Product</div>
            {["Features", "Pricing", "Carriers", "API Docs"].map(l => <button key={l} className="footer-link">{l}</button>)}
          </div>
          <div>
            <div className="footer-col-title">Company</div>
            {["About", "Blog", "Careers", "Press"].map(l => <button key={l} className="footer-link">{l}</button>)}
          </div>
          <div>
            <div className="footer-col-title">Support</div>
            {["Help Centre", "Contact Us", "Status", "Privacy Policy"].map(l => <button key={l} className="footer-link">{l}</button>)}
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© 2026 SwiftPort Ltd. All rights reserved.</span>
          <span className="footer-copy">Made with ◈ in Lagos, Nigeria</span>
        </div>
      </footer>

    </div>
  );
}
