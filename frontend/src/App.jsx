import { Routes, Route, useLocation } from "react-router-dom";

// ── Auth ──────────────────────────────────────────────────────────────────
import ProtectedRoute from "./context/ProtectedRoute";

// ── Public pages ──────────────────────────────────────────────────────────
import Landing from "./Pages/Landing/Landing";
import Login from "./Pages/Login/Login";
import Register from "./Pages/Register/Register";
import TrackOrder from "./Pages/admin/TrackOrder/TrackOrder";
import NotFound from "./Pages/NotFound/NotFound";

// ── Seller (protected) pages ──────────────────────────────────────────────
import Dashboard from "./Pages/admin/Dashboard/Test.jsx";
import Shipments from "./Pages/admin/Shipments/Shipments";
import ShipmentDetail from "./Pages/admin/ShipmentDetails/ShipmentDetails";
import Tracking from "./Pages/admin/Tracking/Tracking";
import Stats from "./Pages/admin/Stats/Stats";
import Settings from "./Pages/admin/Settings/Settings";
import Team from "./Pages/admin/Team/Team";
import CreateDispatch from "./Pages/admin/CreateDispatch/CreateDispatch";
import UpdateStatus from "./Pages/admin/UpdateStatus/UpdateStatus";
// import UpdateStatus   from "./Pages/UpdateStatus/UpdateStatus";
import Disputes from "./Pages/admin/Disputes/Disputes";

// ── Customer portal pages ─────────────────────────────────────────────────
import PortalHeader from "./components/portalHeader/PortalHeader";
// import PortalDashboard from "./Pages/users/PortalDashboard/PortalDashboard";
// import PortalOrders from "./Pages/users/PortalOrders/PortalOrders";
// import PortalNew from "./Pages/users/PortalNew/PortalNew";
// import PortalProfile from "./Pages/users/PortalProfile/PortalProfile";
// import PortalNotifications from "./Pages/users/PortalNotification/PortalNotification";
// import Signup from "./Pages/users/Signup/Signup";

// ── Seller admin header ───────────────────────────────────────────────────
import ShippingHeader from "./components/shippingHeader/ShippingHeader";

// Routes that show the seller admin header
const ADMIN_HEADER_ROUTES = [
  "/dashboard",
  "/shipments",
  "/tracking",
  "/settings",
  "/team",
  "/analytics",
  "/create-dispatch",
];

// Routes that show the portal (buyer) header
const PORTAL_ROUTES = [
  "/portal/dashboard",
  "/portal/orders",
  "/portal/track",
  "/portal/new",
  "/portal/profile",
  "/portal/notifications",
];

function Layout() {
  const { pathname } = useLocation();

  const showAdminHeader = ADMIN_HEADER_ROUTES.some((r) =>
    pathname.startsWith(r),
  );
  const showPortalHeader = PORTAL_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <>
      {showAdminHeader && <ShippingHeader />}
      {showPortalHeader && <PortalHeader />}

      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* <Route path="/signup" element={<Signup />} /> */}

        {/* Public buyer tracking — no login needed */}
        <Route path="/track/:trackingId" element={<TrackOrder />} />
        <Route path="/track" element={<TrackOrder />} />

        {/* ── Protected seller routes ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipments"
          element={
            <ProtectedRoute>
              <Shipments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipments/:id"
          element={
            <ProtectedRoute>
              <ShipmentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracking"
          element={
            <ProtectedRoute>
              <Tracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Stats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <Team />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-dispatch"
          element={
            <ProtectedRoute>
              <CreateDispatch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/update-status"
          element={
            <ProtectedRoute>
              <UpdateStatus />
            </ProtectedRoute>
          }
        />

        <Route
          path="/disputes"
          element={
            <ProtectedRoute>
              <Disputes />
            </ProtectedRoute>
          }
        />

        {/* ── Customer portal ── */}

        {/* <Route path="/portal/dashboard" element={<PortalDashboard />} />
        <Route path="/portal/orders" element={<PortalOrders />} />
        <Route path="/portal/new" element={<PortalNew />} />
        <Route path="/portal/profile" element={<PortalProfile />} />
        <Route path="/portal/notifications" element={<PortalNotifications />} /> */}

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return <Layout />;
}
