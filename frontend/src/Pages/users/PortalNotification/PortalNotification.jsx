import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NOTIFS = [
  {
    id: 1,
    type: "transit",
    icon: "◎",
    title: "SP-9401 departed Lagos hub",
    body: "Your shipment to London, UK is now in transit via DHL Express.",
    time: "2 hrs ago",
    read: false,
  },
  {
    id: 2,
    type: "pending",
    icon: "⬡",
    title: "SP-9352 pickup scheduled",
    body: "UPS will collect your package from Abuja on 13 March between 9–12.",
    time: "5 hrs ago",
    read: false,
  },
  {
    id: 3,
    type: "exception",
    icon: "⚠",
    title: "SP-9320 requires your attention",
    body: "DHL raised an address query for your shipment to Berlin. Action needed.",
    time: "2 days ago",
    read: false,
  },
  {
    id: 4,
    type: "delivered",
    icon: "✓",
    title: "SP-9388 delivered successfully",
    body: "Your shipment to New York, USA was delivered on 10 March at 1:44 PM.",
    time: "2 days ago",
    read: true,
  },
  {
    id: 5,
    type: "delivered",
    icon: "✓",
    title: "SP-9301 delivered to Accra",
    body: "Your FedEx shipment has been delivered to Accra, Ghana.",
    time: "7 days ago",
    read: true,
  },
  {
    id: 6,
    type: "info",
    icon: "◈",
    title: "New carrier rates effective March 2026",
    body: "UPS Worldwide has updated its rate schedule. New rates are now live.",
    time: "10 days ago",
    read: true,
  },
];

const TYPE_COLOR = {
  transit: "#3a3f5c",
  pending: "#b07d2a",
  exception: "#c84b2f",
  delivered: "#2d7a4f",
  info: "#8a8478",
};
const TYPE_BG = {
  transit: "#e8f0fe",
  pending: "#fef3dc",
  exception: "#fdf0ed",
  delivered: "#d8f3e9",
  info: "#f5f3ee",
};

export default function PortalNotifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState(NOTIFS);
  const [filter, setFilter] = useState("All");

  const markRead = (id) =>
    setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAll = () =>
    setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));

  const FILTERS = ["All", "Unread", "Transit", "Delivered", "Exception"];
  const filterMap = {
    All: null,
    Unread: "unread",
    Transit: "transit",
    Delivered: "delivered",
    Exception: "exception",
  };

  const filtered = notifs.filter((n) => {
    if (!filterMap[filter]) return true;
    if (filterMap[filter] === "unread") return !n.read;
    return n.type === filterMap[filter];
  });

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div className="portal-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div>
          <div className="portal-page-title">Notifications</div>
          <div className="portal-page-sub">
            {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 11,
              color: "#c84b2f",
              background: "none",
              border: "1px solid #c84b2f",
              padding: "7px 16px",
              cursor: "pointer",
              letterSpacing: "0.06em",
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 16px",
              background: filter === f ? "#0a0a0f" : "#fff",
              color: filter === f ? "#f5f3ee" : "#3a3f5c",
              fontFamily: "'Syne',sans-serif",
              fontSize: 12,
              fontWeight: 700,
              border: "1.5px solid " + (filter === f ? "#0a0a0f" : "#e8e6e0"),
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ background: "#fff", border: "1.5px solid #e8e6e0" }}>
        {filtered.length === 0 && (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              fontFamily: "'DM Mono',monospace",
              fontSize: 13,
              color: "#8a8478",
              letterSpacing: "0.06em",
            }}
          >
            No notifications.
          </div>
        )}
        {filtered.map((n, i) => (
          <div
            key={n.id}
            onClick={() => markRead(n.id)}
            style={{
              display: "flex",
              gap: 16,
              padding: "18px 24px",
              borderBottom:
                i < filtered.length - 1 ? "1px solid #f0ede8" : "none",
              background: n.read ? "#fff" : "#fafaf8",
              cursor: "pointer",
              transition: "background 0.15s ease",
              position: "relative",
            }}
          >
            {!n.read && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: "#c84b2f",
                }}
              />
            )}
            <div
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                background: TYPE_BG[n.type],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                color: TYPE_COLOR[n.type],
                border: `1px solid ${TYPE_BG[n.type]}`,
                flexShrink: 0,
              }}
            >
              {n.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 13,
                    fontWeight: n.read ? 600 : 800,
                    color: "#0a0a0f",
                    marginBottom: 4,
                  }}
                >
                  {n.title}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 10,
                    color: "#b0aba3",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {n.time}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 11,
                  color: "#8a8478",
                  letterSpacing: "0.03em",
                  lineHeight: 1.6,
                }}
              >
                {n.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
