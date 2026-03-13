import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

const NAV_ICONS = [
  { label: "Dashboard", icon: "⬡", path: "/dashboard" },
  { label: "Shipments", icon: "◈", path: "/shipments" },
  { label: "Tracking", icon: "◎", path: "/tracking" },
  { label: "Analytics", icon: "◧", path: "/analytics" },
  { label: "Settings", icon: "⊕", path: "/settings" },
];

const SETTINGS_NAV = [
  { id: "profile", icon: "◎", label: "Profile" },
  { id: "notifications", icon: "🔔", label: "Notifications" },
  { id: "security", icon: "⬡", label: "Security" },
  { id: "carriers", icon: "◈", label: "Carriers & Rates" },
  { id: "team", icon: "⊕", label: "Team & Permissions" },
  { id: "billing", icon: "◧", label: "Billing & Plans" },
  { id: "danger", icon: "⚠", label: "Danger Zone" },
];

// ── TOGGLE ────────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }) {
  return (
    <div className="toggle-wrap" onClick={() => onChange(!on)}>
      <div className={`toggle-track${on ? " on" : ""}`}>
        <div className="toggle-thumb" />
      </div>
    </div>
  );
}

// ── SECTIONS ─────────────────────────────────────────────────────────────────

function ProfileSection({ dirty, setDirty }) {
  const [form, setForm] = useState({
    name: "James Okafor",
    email: "j.okafor@swiftport.io",
    phone: "+234 801 234 5678",
    company: "SwiftPort Ltd.",
    timezone: "Africa/Lagos",
    language: "English",
  });
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  return (
    <>
      <div className="st-section-header">
        <div className="st-section-title">Profile Settings</div>
        <div className="st-section-sub">
          Update your personal information and preferences
        </div>
      </div>

      <div className="st-card">
        <div className="st-card-head">
          <div>
            <div className="st-card-title">Avatar</div>
            <div className="st-card-sub">JPG or PNG, max 2MB</div>
          </div>
          <button className="btn-outline">Upload</button>
        </div>
        <div className="avatar-block">
          <div className="avatar-circle">JO</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>James Okafor</div>
            <div className="avatar-info">Admin · SwiftPort Ltd.</div>
          </div>
        </div>
      </div>

      <div className="st-card">
        <div className="st-card-head">
          <div>
            <div className="st-card-title">Personal Information</div>
          </div>
        </div>
        {[
          { label: "Full Name", key: "name", placeholder: "Your full name" },
          { label: "Email", key: "email", placeholder: "you@company.com" },
          { label: "Phone", key: "phone", placeholder: "+1 234 567 8900" },
          { label: "Company", key: "company", placeholder: "Company name" },
        ].map((f) => (
          <div key={f.key} className="st-row">
            <div>
              <div className="st-row-label">{f.label}</div>
            </div>
            <div className="st-row-right">
              <input
                className="st-input"
                value={form[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => set(f.key, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="st-card">
        <div className="st-card-head">
          <div>
            <div className="st-card-title">Localisation</div>
          </div>
        </div>
        <div className="st-row">
          <div>
            <div className="st-row-label">Timezone</div>
          </div>
          <div className="st-row-right">
            <select
              className="st-select"
              value={form.timezone}
              onChange={(e) => set("timezone", e.target.value)}
            >
              {[
                "Africa/Lagos",
                "Europe/London",
                "America/New_York",
                "Asia/Dubai",
                "Asia/Singapore",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="st-row">
          <div>
            <div className="st-row-label">Language</div>
          </div>
          <div className="st-row-right">
            <select
              className="st-select"
              value={form.language}
              onChange={(e) => set("language", e.target.value)}
            >
              {["English", "French", "Arabic", "Spanish", "Portuguese"].map(
                (l) => (
                  <option key={l}>{l}</option>
                ),
              )}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}

function NotificationsSection({ dirty, setDirty }) {
  const [prefs, setPrefs] = useState({
    shipDelivered: true,
    shipException: true,
    shipPickup: false,
    labelCreated: false,
    bulkImport: true,
    carrierRates: false,
    weeklyReport: true,
    emailDigest: false,
  });
  const toggle = (k) => {
    setPrefs((p) => ({ ...p, [k]: !p[k] }));
    setDirty(true);
  };

  const rows = [
    {
      key: "shipDelivered",
      label: "Shipment Delivered",
      sub: "When a package reaches its destination",
    },
    {
      key: "shipException",
      label: "Shipment Exception",
      sub: "Customs holds, failed deliveries, delays",
    },
    {
      key: "shipPickup",
      label: "Pickup Confirmed",
      sub: "When carrier collects from sender",
    },
    {
      key: "labelCreated",
      label: "Label Created",
      sub: "When a new shipping label is generated",
    },
    {
      key: "bulkImport",
      label: "Bulk Import Complete",
      sub: "When a batch import finishes",
    },
    {
      key: "carrierRates",
      label: "Carrier Rate Updates",
      sub: "When DHL / FedEx / UPS update pricing",
    },
    {
      key: "weeklyReport",
      label: "Weekly Summary Report",
      sub: "Email digest every Monday",
    },
    {
      key: "emailDigest",
      label: "Daily Digest",
      sub: "Summary of all activity each day",
    },
  ];

  return (
    <>
      <div className="st-section-header">
        <div className="st-section-title">Notifications</div>
        <div className="st-section-sub">
          Choose what alerts you receive and how
        </div>
      </div>

      <div className="st-card">
        <div className="st-card-head">
          <div>
            <div className="st-card-title">Email Notifications</div>
          </div>
        </div>
        {rows.map((r) => (
          <div key={r.key} className="st-row">
            <div>
              <div className="st-row-label">{r.label}</div>
              <div className="st-row-sub">{r.sub}</div>
            </div>
            <div className="st-row-right">
              <Toggle on={prefs[r.key]} onChange={() => toggle(r.key)} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SecuritySection({ dirty, setDirty }) {
  const [twoFA, setTwoFA] = useState(false);
  const [sessions] = useState([
    {
      device: "MacBook Pro — Chrome",
      location: "Lagos, NG",
      time: "Active now",
      current: true,
    },
    {
      device: "iPhone 15 — Safari",
      location: "Lagos, NG",
      time: "2 hours ago",
      current: false,
    },
    {
      device: "Windows PC — Firefox",
      location: "Abuja, NG",
      time: "3 days ago",
      current: false,
    },
  ]);

  return (
    <>
      <div className="st-section-header">
        <div className="st-section-title">Security</div>
        <div className="st-section-sub">
          Manage your password, 2FA, and active sessions
        </div>
      </div>

      <div className="st-card">
        <div className="st-card-head">
          <div>
            <div className="st-card-title">Password</div>
          </div>
        </div>
        <div className="st-row">
          <div>
            <div className="st-row-label">Current Password</div>
          </div>
          <div className="st-row-right">
            <input
              className="st-input"
              type="password"
              placeholder="••••••••"
              onChange={() => setDirty(true)}
            />
          </div>
        </div>
        <div className="st-row">
          <div>
            <div className="st-row-label">New Password</div>
          </div>
          <div className="st-row-right">
            <input
              className="st-input"
              type="password"
              placeholder="Min. 8 characters"
              onChange={() => setDirty(true)}
            />
          </div>
        </div>
        <div className="st-row">
          <div>
            <div className="st-row-label">Confirm New Password</div>
          </div>
          <div className="st-row-right">
            <input
              className="st-input"
              type="password"
              placeholder="Repeat new password"
              onChange={() => setDirty(true)}
            />
          </div>
        </div>
      </div>

      <div className="st-card">
        <div className="st-card-head">
          <div>
            <div className="st-card-title">Two-Factor Authentication</div>
          </div>
        </div>
        <div className="st-row">
          <div>
            <div className="st-row-label">Enable 2FA</div>
            <div className="st-row-sub">
              Require a verification code on each login
            </div>
          </div>
          <div className="st-row-right">
            <Toggle
              on={twoFA}
              onChange={(v) => {
                setTwoFA(v);
                setDirty(true);
              }}
            />
          </div>
        </div>
      </div>

      <div className="st-card">
        <div className="st-card-head">
          <div>
            <div className="st-card-title">Active Sessions</div>
          </div>
          <button className="btn-danger">Revoke All</button>
        </div>
        {sessions.map((s, i) => (
          <div key={i} className="st-row">
            <div>
              <div className="st-row-label">{s.device}</div>
              <div className="st-row-sub">
                {s.location} · {s.time}
              </div>
            </div>
            <div className="st-row-right">
              {s.current ? (
                <span
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 11,
                    color: "var(--success)",
                    letterSpacing: "0.06em",
                  }}
                >
                  ● This device
                </span>
              ) : (
                <button
                  className="btn-danger"
                  style={{ padding: "5px 12px", fontSize: 12 }}
                >
                  Revoke
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CarriersSection({ dirty, setDirty }) {
  const [carriers, setCarriers] = useState([
    {
      name: "DHL Express",
      enabled: true,
      apiKey: "dhl_live_••••••••••4a1f",
      markup: "5",
    },
    {
      name: "FedEx Intl.",
      enabled: true,
      apiKey: "fx_live_••••••••••9c2d",
      markup: "3",
    },
    { name: "UPS Worldwide", enabled: false, apiKey: "", markup: "0" },
  ]);

  const toggle = (i) => {
    setCarriers((cs) =>
      cs.map((c, idx) => (idx === i ? { ...c, enabled: !c.enabled } : c)),
    );
    setDirty(true);
  };

  return (
    <>
      <div className="st-section-header">
        <div className="st-section-title">Carriers &amp; Rates</div>
        <div className="st-section-sub">
          Connect carrier accounts and configure markup
        </div>
      </div>

      {carriers.map((c, i) => (
        <div key={c.name} className="st-card">
          <div className="st-card-head">
            <div>
              <div className="st-card-title">{c.name}</div>
              <div className="st-card-sub">
                {c.enabled ? "Connected" : "Not connected"}
              </div>
            </div>
            <Toggle on={c.enabled} onChange={() => toggle(i)} />
          </div>
          {c.enabled && (
            <>
              <div className="st-row">
                <div>
                  <div className="st-row-label">API Key</div>
                </div>
                <div className="st-row-right">
                  <input
                    className="st-input"
                    defaultValue={c.apiKey}
                    placeholder="Enter API key"
                    onChange={() => setDirty(true)}
                  />
                </div>
              </div>
              <div className="st-row">
                <div>
                  <div className="st-row-label">Markup (%)</div>
                  <div className="st-row-sub">
                    Added on top of carrier base rate
                  </div>
                </div>
                <div className="st-row-right">
                  <input
                    className="st-input st-input-sm"
                    defaultValue={c.markup}
                    type="number"
                    min="0"
                    max="100"
                    onChange={() => setDirty(true)}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </>
  );
}

function DangerSection() {
  return (
    <>
      <div className="st-section-header">
        <div className="st-section-title">Danger Zone</div>
        <div className="st-section-sub">
          Irreversible actions — proceed with caution
        </div>
      </div>

      <div className="st-card">
        <div
          className="st-card-head"
          style={{ borderBottom: "1.5px solid #f5ddd8" }}
        >
          <div>
            <div className="st-card-title" style={{ color: "var(--rust)" }}>
              Destructive Actions
            </div>
          </div>
        </div>
        {[
          {
            label: "Export All Data",
            sub: "Download a full JSON export of your account",
            btn: "Export",
            style: "outline",
          },
          {
            label: "Clear Shipment History",
            sub: "Permanently delete all shipment records",
            btn: "Clear History",
            style: "danger",
          },
          {
            label: "Suspend Account",
            sub: "Temporarily disable access for all team members",
            btn: "Suspend",
            style: "danger",
          },
          {
            label: "Delete Account",
            sub: "Permanently delete this organisation and all data",
            btn: "Delete",
            style: "danger",
          },
        ].map((r) => (
          <div key={r.label} className="st-danger-row">
            <div>
              <div className="st-danger-label">{r.label}</div>
              <div className="st-danger-sub">{r.sub}</div>
            </div>
            <button className={`btn-${r.style}`}>{r.btn}</button>
          </div>
        ))}
      </div>
    </>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function Settings() {
  const [activeNav, setActiveNav] = useState("Settings");
  const [activeSection, setSection] = useState("profile");
  const [dirty, setDirty] = useState(false);
  const navigate = useNavigate();

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSection dirty={dirty} setDirty={setDirty} />;
      case "notifications":
        return <NotificationsSection dirty={dirty} setDirty={setDirty} />;
      case "security":
        return <SecuritySection dirty={dirty} setDirty={setDirty} />;
      case "carriers":
        return <CarriersSection dirty={dirty} setDirty={setDirty} />;
      case "danger":
        return <DangerSection />;
      default:
        return (
          <div>
            <div className="st-section-header">
              <div className="st-section-title">
                {SETTINGS_NAV.find((n) => n.id === activeSection)?.label}
              </div>
              <div className="st-section-sub">Coming soon</div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
     

      <div className="st-shell">
       
        {/* App sidebar */}
        <aside className="st-sidebar">
          {NAV_ICONS.map((n) => (
            <div
              key={n.label}
              title={n.label}
              className={`sb-icon${activeNav === n.label ? " active" : ""}`}
              onClick={() => {
                setActiveNav(n.label);
                navigate(n.path);
              }}
            >
              {n.icon}
            </div>
          ))}
          <div className="sb-sep" />
          <div className="sb-bottom">
            <div className="sb-icon" title="Sign Out">
              ↩
            </div>
          </div>
        </aside>

        <div className="st-main">
          <div className="st-body">
            {/* Settings nav */}
            <nav className="st-nav">
              <div className="st-nav-title">Settings</div>
              {SETTINGS_NAV.map((item, i) => (
                <>
                  {i === SETTINGS_NAV.length - 1 && (
                    <div key="sep" className="st-nav-sep" />
                  )}
                  <button
                    key={item.id}
                    className={`st-nav-item${activeSection === item.id ? " active" : ""}`}
                    onClick={() => {
                      setSection(item.id);
                      setDirty(false);
                    }}
                  >
                    <span className="st-nav-icon">{item.icon}</span>
                    {item.label}
                  </button>
                </>
              ))}
            </nav>

            {/* Settings content */}
            <div className="st-content">{renderSection()}</div>
          </div>

          {/* Sticky save bar */}
          {dirty && (
            <div className="save-bar">
              <span className="save-bar-msg">You have unsaved changes</span>
              <div className="save-bar-actions">
                <button className="btn-discard" onClick={() => setDirty(false)}>
                  Discard
                </button>
                <button className="btn-save" onClick={() => setDirty(false)}>
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </>
  );
}
