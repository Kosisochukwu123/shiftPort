import { useState } from "react";
import "./PortalProfile.css";

const userName  = () => sessionStorage.getItem("sp_user") || "Emeka Eze";
const initials  = name => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const ADDRESSES = [
  { type: "Home",   name: "Emeka Eze",    line: "14 Bode Thomas St\nSurulere, Lagos\nNigeria",     isDefault: true  },
  { type: "Office", name: "Emeka Eze",    line: "Plot 3 Wuse Zone 5\nAbuja FCT\nNigeria",          isDefault: false },
];

const NOTIF_SETTINGS = [
  { title: "Pickup Confirmation",   desc: "Get notified when your package is picked up", key: "pickup"    },
  { title: "In Transit Updates",    desc: "Receive updates at each transit milestone",   key: "transit"   },
  { title: "Out for Delivery",      desc: "Alert when your package is out for delivery", key: "outdeliv"  },
  { title: "Delivery Confirmation", desc: "Confirm when your package is delivered",      key: "delivered" },
  { title: "Exceptions & Delays",   desc: "Be informed of any delays or issues",         key: "exception" },
  { title: "Promotional Emails",    desc: "Offers, tips, and platform updates",          key: "promo"     },
];

export default function PortalProfile() {
  const name = userName();
  const [activeTab, setActiveTab] = useState("profile");
  const [form, setForm] = useState({ name, email: "emeka@example.com", phone: "+234 800 000 0000", company: "", country: "Nigeria" });
  const [notifs, setNotifs] = useState({ pickup: true, transit: true, outdeliv: true, delivered: true, exception: true, promo: false });
  const [saved, setSaved] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggleNotif = k => setNotifs(n => ({ ...n, [k]: !n[k] }));

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const TABS = ["profile", "addresses", "notifications", "security"];

  return (
    <div className="portal-page">
      <div className="portal-page-title">My Profile</div>
      <div className="portal-page-sub">Manage your account details, addresses, and notification preferences.</div>

      <div className="pp-grid">
        {/* Sidebar */}
        <div className="pp-sidebar">
          <div className="pp-avatar-card">
            <div className="pp-avatar-circle">{initials(name)}</div>
            <div className="pp-avatar-name">{name}</div>
            <div className="pp-avatar-email">{form.email}</div>
            <div className="pp-avatar-badge">Customer Account</div>
          </div>
          <div className="pp-nav-card">
            {TABS.map(t => (
              <button key={t} className={`pp-nav-item${activeTab === t ? " active" : ""}`}
                onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="pp-main">

          {/* Profile */}
          {activeTab === "profile" && (
            <div className="pp-card">
              <div className="pp-card-head">
                <div className="pp-card-title">Personal Information</div>
                {saved && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#2d7a4f" }}>✓ Saved</span>}
              </div>
              <div className="pp-card-body">
                <div className="pp-grid-2">
                  <div className="pp-field"><label className="pp-label">Full Name</label><input className="pp-input" value={form.name} onChange={set("name")} /></div>
                  <div className="pp-field"><label className="pp-label">Email Address</label><input className="pp-input" type="email" value={form.email} onChange={set("email")} /></div>
                </div>
                <div className="pp-grid-2">
                  <div className="pp-field"><label className="pp-label">Phone Number</label><input className="pp-input" value={form.phone} onChange={set("phone")} /></div>
                  <div className="pp-field"><label className="pp-label">Company (optional)</label><input className="pp-input" placeholder="Your company name" value={form.company} onChange={set("company")} /></div>
                </div>
                <div className="pp-field" style={{ marginBottom: 24 }}>
                  <label className="pp-label">Country</label>
                  <input className="pp-input" value={form.country} onChange={set("country")} style={{ maxWidth: 300 }} />
                </div>
                <button className="pp-save-btn" onClick={save}>Save Changes</button>
              </div>
            </div>
          )}

          {/* Addresses */}
          {activeTab === "addresses" && (
            <div className="pp-card">
              <div className="pp-card-head">
                <div className="pp-card-title">Saved Addresses</div>
                <button className="pd-card-link" style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#c84b2f", background: "none", border: "none", cursor: "pointer" }}>+ Add Address</button>
              </div>
              <div className="pp-card-body">
                <div className="pp-addresses">
                  {ADDRESSES.map(a => (
                    <div key={a.type} className={`pp-addr-card${a.isDefault ? " default" : ""}`}>
                      {a.isDefault && <div className="pp-addr-default">DEFAULT</div>}
                      <div className="pp-addr-type">{a.type}</div>
                      <div className="pp-addr-name">{a.name}</div>
                      <div className="pp-addr-line">{a.line}</div>
                      <div className="pp-addr-actions">
                        <button className="pp-addr-btn">Edit</button>
                        {!a.isDefault && <button className="pp-addr-btn">Set Default</button>}
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#8a8478", letterSpacing: "0.04em" }}>
                  Saved addresses speed up future bookings. Your default address is pre-filled as the sender.
                </p>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="pp-card">
              <div className="pp-card-head"><div className="pp-card-title">Notification Preferences</div></div>
              <div className="pp-card-body">
                {NOTIF_SETTINGS.map(n => (
                  <div key={n.key} className="pp-toggle-row">
                    <div className="pp-toggle-info">
                      <div className="pp-toggle-title">{n.title}</div>
                      <div className="pp-toggle-desc">{n.desc}</div>
                    </div>
                    <button className={`pp-toggle${notifs[n.key] ? " on" : ""}`} onClick={() => toggleNotif(n.key)} />
                  </div>
                ))}
                <div style={{ marginTop: 20 }}>
                  <button className="pp-save-btn" onClick={save}>Save Preferences</button>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <div className="pp-card">
              <div className="pp-card-head"><div className="pp-card-title">Security Settings</div></div>
              <div className="pp-card-body">
                <div className="pp-grid-2" style={{ marginBottom: 24 }}>
                  <div className="pp-field"><label className="pp-label">Current Password</label><input className="pp-input" type="password" placeholder="••••••••" /></div>
                  <div />
                  <div className="pp-field"><label className="pp-label">New Password</label><input className="pp-input" type="password" placeholder="Min. 8 characters" /></div>
                  <div className="pp-field"><label className="pp-label">Confirm New Password</label><input className="pp-input" type="password" placeholder="Repeat new password" /></div>
                </div>
                <button className="pp-save-btn" onClick={save}>Update Password</button>

                <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #e8e6e0" }}>
                  <div className="pp-toggle-row">
                    <div className="pp-toggle-info">
                      <div className="pp-toggle-title">Two-Factor Authentication</div>
                      <div className="pp-toggle-desc">Add an extra layer of security with a one-time code sent to your phone.</div>
                    </div>
                    <button className="pp-toggle" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
