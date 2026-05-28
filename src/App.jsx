import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";
import { health } from "./libs/api/auth.js";
import { closeAllModals } from "./components/ui/Modal.jsx";

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    health().catch(() => {});
  }, []);

  // C.1 route rule, wired once for every route (public and signed in).
  // Layout registers the onFirstOpen hook; it does not close modals itself.
  useEffect(() => {
    closeAllModals("route");
  }, [pathname]);

  return <AppRoutes />;
}
