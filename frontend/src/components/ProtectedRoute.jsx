import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function ProtectedRoute({ children, allow }) {
  const { currentUser, bootstrapping } = useApp();
  const location = useLocation();

  if (bootstrapping) return null;

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allow && !allow.some((r) => currentUser.roles?.includes(r))) {
    return <Navigate to="/" replace />;
  }

  return children;
}
