import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { count } = useCart();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const isAdmin = user?.role === "ADMIN";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <Link to="/products" className="brand">
        🛒 ShopHub
      </Link>
      <nav className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/products">Products</Link>
            <Link to="/orders">Orders</Link>
            {isAdmin && <Link to="/admin">Admin</Link>}
            <Link to="/notifications" className="cart-link">
              🔔
              {unreadCount > 0 && <span className="cart-badge">{unreadCount}</span>}
            </Link>
            <Link to="/cart" className="cart-link">
              Cart
              {count > 0 && <span className="cart-badge">{count}</span>}
            </Link>
            <span className="nav-user">{user?.fullName || user?.email}</span>
            <button className="btn btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
