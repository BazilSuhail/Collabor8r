import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Spinner from "../components/ui/Spinner.jsx";

// AuthContext status: "loading" while the session boots, then "authenticated" or "anonymous".
export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "authenticated") return <Outlet />;
  if (status === "loading") {
    return (
      <div className="grid min-h-[100dvh] place-items-center">
        <Spinner size="lg" />
      </div>
    );
  }
  return <Navigate to="/login" replace state={{ from: location }} />;
}
