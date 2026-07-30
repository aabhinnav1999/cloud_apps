import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { extractErrorMessage } from "../api/client.js";

function formatPrice(value) {
  const num = Number(value);
  return Number.isNaN(num) ? value : `$${num.toFixed(2)}`;
}

export default function Cart() {
  const { cart, loading, updateQuantity, removeItem, clear } = useCart();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const items = cart?.items || [];

  async function changeQty(productId, quantity) {
    if (quantity < 1) return;
    setBusyId(productId);
    setError("");
    try {
      await updateQuantity(productId, quantity);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not update quantity"));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(productId) {
    setBusyId(productId);
    setError("");
    try {
      await removeItem(productId);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not remove item"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleClear() {
    setError("");
    try {
      await clear();
    } catch (err) {
      setError(extractErrorMessage(err, "Could not clear cart"));
    }
  }

  if (loading) {
    return <p className="muted">Loading cart…</p>;
  }

  if (items.length === 0) {
    return (
      <section className="empty-state">
        <h1>Your cart is empty</h1>
        <p className="muted">Browse products and add something you like.</p>
        <Link to="/products" className="btn btn-primary">
          Shop products
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="page-head">
        <h1>Your Cart</h1>
        <button className="btn btn-ghost" onClick={handleClear}>
          Clear cart
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="cart-layout">
        <ul className="cart-items">
          {items.map((item) => (
            <li key={item.productId} className="cart-item">
              <div className="cart-item-img">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} loading="lazy" />
                ) : (
                  <div className="img-placeholder">No image</div>
                )}
              </div>
              <div className="cart-item-info">
                <h3>{item.name}</h3>
                <p className="brand">{item.brand}</p>
                <p className="price">{formatPrice(item.price)}</p>
              </div>
              <div className="cart-item-actions">
                <div className="qty">
                  <button
                    onClick={() => changeQty(item.productId, item.quantity - 1)}
                    disabled={busyId === item.productId || item.quantity <= 1}
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => changeQty(item.productId, item.quantity + 1)}
                    disabled={busyId === item.productId}
                  >
                    +
                  </button>
                </div>
                <span className="line-total">
                  {formatPrice(Number(item.price) * item.quantity)}
                </span>
                <button
                  className="link-danger"
                  onClick={() => remove(item.productId)}
                  disabled={busyId === item.productId}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="cart-summary">
          <h2>Summary</h2>
          <div className="summary-row">
            <span>Items</span>
            <span>{cart.totalQuantity}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(cart.totalAmount)}</span>
          </div>
          <button
            className="btn btn-primary full"
            onClick={() => navigate("/checkout")}
          >
            Proceed to checkout
          </button>
          <Link to="/products" className="muted center block">
            Continue shopping
          </Link>
        </aside>
      </div>
    </section>
  );
}
