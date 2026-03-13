import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PortalOrders.css";

const ALL_ORDERS = [
  { id: "SP-9401", from: "Lagos, NG",   to: "London, UK",      carrier: "DHL Express",         status: "transit",   weight: "2.4 kg", price: "₦48,200", date: "12 Mar 2026" },
  { id: "SP-9388", from: "Lagos, NG",   to: "New York, USA",   carrier: "FedEx International", status: "delivered", weight: "1.1 kg", price: "₦62,500", date: "10 Mar 2026" },
  { id: "SP-9352", from: "Abuja, NG",   to: "Dubai, UAE",      carrier: "UPS Worldwide",       status: "pending",   weight: "5.0 kg", price: "₦74,000", date: "9 Mar 2026"  },
  { id: "SP-9320", from: "Lagos, NG",   to: "Berlin, Germany", carrier: "DHL Express",         status: "exception", weight: "0.8 kg", price: "₦38,900", date: "7 Mar 2026"  },
  { id: "SP-9301", from: "Lagos, NG",   to: "Accra, Ghana",    carrier: "FedEx International", status: "delivered", weight: "3.2 kg", price: "₦22,400", date: "5 Mar 2026"  },
  { id: "SP-9278", from: "Kano, NG",    to: "Paris, France",   carrier: "DHL Express",         status: "delivered", weight: "2.0 kg", price: "₦55,700", date: "28 Feb 2026" },
  { id: "SP-9241", from: "Lagos, NG",   to: "Toronto, Canada", carrier: "UPS Worldwide",       status: "delivered", weight: "4.5 kg", price: "₦81,300", date: "20 Feb 2026" },
  { id: "SP-9198", from: "Abuja, NG",   to: "Nairobi, Kenya",  carrier: "FedEx International", status: "delivered", weight: "1.6 kg", price: "₦18,600", date: "12 Feb 2026" },
];

const FILTERS = ["All", "In Transit", "Delivered", "Pending", "Exception"];

export default function PortalOrders() {
  const navigate = useNavigate();
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All");

  const filterMap = { "All": null, "In Transit": "transit", "Delivered": "delivered", "Pending": "pending", "Exception": "exception" };

  const filtered = ALL_ORDERS.filter(o => {
    const matchStatus = !filterMap[filter] || o.status === filterMap[filter];
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.to.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="portal-page">
      <div className="portal-page-title">My Shipments</div>
      <div className="portal-page-sub">All your past and active orders in one place.</div>

      {/* Filters */}
      <div className="po-filters">
        <input className="po-search" placeholder="Search by ID or destination…"
          value={search} onChange={e => setSearch(e.target.value)} />
        {FILTERS.map(f => (
          <button key={f} className={`po-filter-btn${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {/* Table */}
      <div className="po-table-card">
        <div className="po-table-head">
          <div className="portal-page-title" style={{ fontSize: 14 }}>Orders</div>
          <div className="po-count">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</div>
        </div>
        {filtered.length === 0 ? (
          <div className="po-empty">No shipments found.</div>
        ) : (
          <table className="po-table">
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Route</th>
                <th>Carrier</th>
                <th>Weight</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} onClick={() => navigate(`/portal/orders/${o.id}`)}>
                  <td><div className="po-id">{o.id}</div></td>
                  <td>
                    <div className="po-route">{o.to}</div>
                    <div className="po-sub">from {o.from}</div>
                  </td>
                  <td><div className="po-carrier">{o.carrier}</div></td>
                  <td><div className="po-weight">{o.weight}</div></td>
                  <td><span className={`po-badge ${o.status}`}>{o.status.toUpperCase()}</span></td>
                  <td><div className="po-price">{o.price}</div></td>
                  <td><div className="po-date">{o.date}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
