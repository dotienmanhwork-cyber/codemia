import { Outlet } from "react-router-dom";
import Navbar from "../shared/components/site-layout/Navbar";
import Footer from "../shared/components/site-layout/Footer";

export default function PublicLayout() {
  return (
    <>
      <Navbar />

      <main>
        <Outlet />
      </main>

      <Footer />
    </>
  );
}