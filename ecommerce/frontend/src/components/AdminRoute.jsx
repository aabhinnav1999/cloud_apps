import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Gate: must be authenticated AND have the ADMIN role.
export default function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== "ADMIN") {
    return <Navigate to="/products" replace />;
  }
  return children;
}
