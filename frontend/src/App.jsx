import {  Routes, Route } from "react-router-dom";
// import Home from "./Pages/Home";
import Shipments from "./Pages/admin/Shipments/Shipments";
import Tracking from "./Pages/admin/Tracking/Tracking";
import ShipmentDetail from "./Pages/admin/ShipmentDetails/ShipmentDetails";
import Login from "./Pages/Login/Login";
import Settings from "./Pages/admin/Settings/Settings";
import Analytics from "./Pages/admin/Stats/Stats";
import Team from "./Pages/admin/Team/Team";
import Landing from "./Pages/Landing/Landing";
// import NotFound from "..Downloads/NotFound";
import NotFound from "./Pages/NotFound/NotFound";
import Signup from "./Pages/users/Signup/Signup";
import PortalDashboard from "./Pages/users/PortalDashboard/PortalDashboard";
import PortalOrders from "./Pages/users/PortalOrders/PortalOrders";
import PortalTrack from "./Pages/users/Portaltracking/PortalTrack";
import PortalNew from "./Pages/users/PortalNew/PortalNew";
import PortalProfile from "./Pages/users/PortalProfile/PortalProfile";
import PortalNotification from "./Pages/users/PortalNotification/PortalNotification";
import Dashboard from "./Pages/admin/DashBoard/Dashboard";
import AdminLayout from "./Layout/AdminLayout";
import PortalLayout from "./Layout/PortalLayout";
import "./App.css";


function Layout() {


  return (
    <>
      <Routes>
        {/* PUBLIC ROUTES */}

        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/portal/signup" element={<Signup />} />

        {/* ---------------- ADMIN AREA ---------------- */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/shipment/:id" element={<ShipmentDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/team" element={<Team />} />
        </Route>

        {/* ---------------- USER PORTAL ---------------- */}
        <Route element={<PortalLayout />}>
          <Route path="/portal/dashboard" element={<PortalDashboard />} />
          <Route path="/portal/orders" element={<PortalOrders />} />
          <Route path="/portal/track" element={<PortalTrack />} />
          <Route path="/portal/new" element={<PortalNew />} />
          <Route path="/portal/profile" element={<PortalProfile />} />
          <Route
            path="/portal/notifications"
            element={<PortalNotification />}
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  return <Layout />;
}

export default App;
