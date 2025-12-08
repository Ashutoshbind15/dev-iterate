import { Outlet } from "react-router";
import Navbar from "./navbar";
import { Toaster } from "../ui/sonner";

const Layout = () => {
  return (
    <div>
      <Navbar />
      <Outlet />
      <Toaster />
    </div>
  );
};

export default Layout;
