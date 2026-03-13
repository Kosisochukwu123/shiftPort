import { Outlet } from "react-router-dom";
import PortalHeader from "../components/PortalHeader/PortalHeader";

export default function PortalLayout() {
  return (
    <>
      <PortalHeader />
      <main>
        <Outlet />
      </main>
    </>
  );
}