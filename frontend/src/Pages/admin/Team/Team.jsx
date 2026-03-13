import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Team.css";

// ── DATA ──────────────────────────────────────────────────────────────────────

const NAV_ICONS = [
  { label: "Dashboard", icon: "⬡", path: "/dashboard" },
  { label: "Shipments", icon: "◈", path: "/shipments"  },
  { label: "Tracking",  icon: "◎", path: "/tracking"   },
  { label: "Analytics", icon: "◧", path: "/analytics"  },
  { label: "Settings",  icon: "⊕", path: "/settings"   },
];

const INIT_MEMBERS = [
  { id: 1,  name: "James Okafor",   email: "j.okafor@swiftport.io",   role: "Admin",    status: "Active",  joined: "Jan 2025", avatar: "#3a3f5c", initials: "JO", current: true  },
  { id: 2,  name: "Amaka Nwosu",    email: "a.nwosu@swiftport.io",    role: "Manager",  status: "Active",  joined: "Feb 2025", avatar: "#c84b2f", initials: "AN", current: false },
  { id: 3,  name: "Segun Adeleke",  email: "s.adeleke@swiftport.io",  role: "Operator", status: "Active",  joined: "Mar 2025", avatar: "#2d7a4f", initials: "SA", current: false },
  { id: 4,  name: "Fatima Bello",   email: "f.bello@swiftport.io",    role: "Operator", status: "Active",  joined: "Apr 2025", avatar: "#b07d2a", initials: "FB", current: false },
  { id: 5,  name: "Chukwuemeka O", email: "c.obi@swiftport.io",      role: "Viewer",   status: "Active",  joined: "May 2025", avatar: "#5a5a8c", initials: "CO", current: false },
  { id: 6,  name: "Ngozi Eze",      email: "n.eze@swiftport.io",      role: "Manager",  status: "Inactive",joined: "Jun 2025", avatar: "#7a6a5a", initials: "NE", current: false },
  { id: 7,  name: "Taiwo Adesanya", email: "t.adesanya@swiftport.io", role: "Operator", status: "Pending", joined: "—",        avatar: "#4a7a6a", initials: "TA", current: false },
];

const ROLE_META = {
  Admin:    { bg: "#fdf0ed", text: "#c84b2f" },
  Manager:  { bg: "#eef1fb", text: "#3a3f5c" },
  Operator: { bg: "#e8f5ee", text: "#2d7a4f" },
  Viewer:   { bg: "#f0eee8", text: "#8a8478" },
};

const STATUS_META = {
  Active:   { color: "#2d7a4f", dot: "#2d7a4f" },
  Inactive: { color: "#8a8478", dot: "#8a8478" },
  Pending:  { color: "#b07d2a", dot: "#b07d2a" },
};

const ROLES = ["All Roles", "Admin", "Manager", "Operator", "Viewer"];

// ── INVITE MODAL ──────────────────────────────────────────────────────────────

function InviteModal({ onClose, onInvite }) {
  const [form, setForm] = useState({ name: "", email: "", role: "Operator" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name || !form.email) return;
    onInvite(form);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">Invite Team Member</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field-wrap">
            <label className="field-label">Full Name</label>
            <input className="field-input" placeholder="e.g. Ife Adeyemi"
              value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Email Address</label>
            <input className="field-input" type="email" placeholder="name@swiftport.io"
              value={form.email} onChange={e => set("email", e.target.value)} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Role</label>
            <select className="field-select" value={form.role} onChange={e => set("role", e.target.value)}>
              {["Admin","Manager","Operator","Viewer"].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-submit" onClick={submit}>Send Invite →</button>
        </div>
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function Team() {
  const [activeNav, setActiveNav] = useState("Settings");
  const [members, setMembers]     = useState(INIT_MEMBERS);
  const [search, setSearch]       = useState("");
  const [roleFilter, setRole]     = useState("All Roles");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const filtered = members
    .filter(m => roleFilter === "All Roles" || m.role === roleFilter)
    .filter(m => {
      const q = search.toLowerCase();
      return !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    });

  const handleInvite = ({ name, email, role }) => {
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const colors   = ["#3a3f5c","#c84b2f","#2d7a4f","#b07d2a","#5a5a8c","#4a7a6a"];
    setMembers(ms => [...ms, {
      id: Date.now(), name, email, role, status: "Pending",
      joined: "—", avatar: colors[ms.length % colors.length],
      initials, current: false,
    }]);
  };

  const removeMember = id => setMembers(ms => ms.filter(m => m.id !== id));

  const stats = [
    { label: "Total Members",  val: members.length,                                     accent: "#3a3f5c" },
    { label: "Active",         val: members.filter(m => m.status === "Active").length,   accent: "#2d7a4f" },
    { label: "Pending Invite", val: members.filter(m => m.status === "Pending").length,  accent: "#b07d2a" },
    { label: "Admins",         val: members.filter(m => m.role === "Admin").length,      accent: "#c84b2f" },
  ];

  return (
    <div className="tm-shell">

      {/* Sidebar */}
      <aside className="tm-sidebar">
        {NAV_ICONS.map(n => (
          <div key={n.label} title={n.label}
            className={`sb-icon${activeNav === n.label ? " active" : ""}`}
            onClick={() => { setActiveNav(n.label); navigate(n.path); }}>
            {n.icon}
          </div>
        ))}
        <div className="sb-sep" />
        <div className="sb-bottom">
          <div className="sb-icon" title="Sign Out">↩</div>
        </div>
      </aside>

      <main className="tm-main">

        {/* Header */}
        <div className="tm-topbar">
          <div>
            <div className="tm-title">Team <span>&amp; Permissions</span></div>
            <div className="tm-sub">Manage who has access to SwiftPort and their roles</div>
          </div>
          <div className="tm-actions">
            <button className="btn-outline">↓ Export</button>
            <button className="btn-primary" onClick={() => setShowModal(true)}>+ Invite Member</button>
          </div>
        </div>

        {/* Stats */}
        <div className="tm-stats">
          {stats.map(s => (
            <div key={s.label} className="tm-stat" style={{ "--stat-accent": s.accent }}>
              <div className="tm-stat-val">{s.val}</div>
              <div className="tm-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="tm-filter">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input placeholder="Search name or email…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="role-filter" value={roleFilter} onChange={e => setRole(e.target.value)}>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="tm-panel">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const rc = ROLE_META[m.role];
                const sc = STATUS_META[m.status];
                return (
                  <tr key={m.id}>
                    <td>
                      <div className="member-cell">
                        <div className="member-avatar" style={{ background: m.avatar }}>
                          {m.initials}
                        </div>
                        <div>
                          <div className="member-name">
                            {m.name} {m.current && (
                              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--success)", marginLeft: 6 }}>● You</span>
                            )}
                          </div>
                          <div className="member-email">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="role-chip" style={{ background: rc.bg, color: rc.text }}>
                        {m.role}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill" style={{ color: sc.color }}>
                        <span className="pill-dot" style={{ background: sc.dot }} />
                        {m.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "var(--warm-gray)" }}>
                      {m.joined}
                    </td>
                    <td>
                      {!m.current && (
                        <div className="row-actions">
                          <button className="row-btn">Edit</button>
                          <button className="row-btn danger" onClick={() => removeMember(m.id)}>Remove</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </main>

      {showModal && (
        <InviteModal onClose={() => setShowModal(false)} onInvite={handleInvite} />
      )}
    </div>
  );
}
