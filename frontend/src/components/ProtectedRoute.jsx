import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

export const ProtectedRoute = ({ children, allow }) => {
  const { currentUser, bootstrapping } = useApp();
  const location = useLocation();

  if (bootstrapping) return <p role="status" className="p-10 text-center">Restoring your session...</p>;

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allow && !allow.some((r) => currentUser.role?.includes(r))) {
    return <Navigate to="/" replace />;
  }

  return children;
};
