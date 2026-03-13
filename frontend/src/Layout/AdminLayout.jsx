import { Outlet } from "react-router-dom";
import ShippingHeader from "../components/ShippingHeader/ShippingHeader";

export default function AdminLayout() {
  return (
    <>
      <ShippingHeader />
      <main>
        <Outlet />
      </main>
    </>
  );
}