import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchMyOrders, cancelOrder } from "../api/orders.js";
import { extractErrorMessage } from "../api/client.js";

function formatPrice(value) {
  const num = Number(value);
  return Number.isNaN(num) ? value : `$${num.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

const CANCELLABLE = new Set(["PENDING", "CONFIRMED"]);

export default function Orders() {
  const location = useLocation();
  const justPlacedOrderId = location.state?.justPlacedOrderId;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMyOrders();
      setOrders(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(orderId) {
    setBusyId(orderId);
    setError("");
    try {
      const updated = await cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err) {
      setError(extractErrorMessage(err, "Could not cancel order"));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="muted">Loading orders…</p>;
  }

  return (
    <section>
      <h1>My Orders</h1>

      {justPlacedOrderId && (
        <div className="alert alert-success">
          ✅ Order #{justPlacedOrderId} placed successfully. Thank you!
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      {orders.length === 0 ? (
        <section className="empty-state">
          <p className="muted">You have no orders yet.</p>
          <Link to="/products" className="btn btn-primary">
            Shop products
          </Link>
        </section>
      ) : (
        <div className="orders">
          {orders.map((order) => (
            <article key={order.id} className="order-card">
              <div className="order-head">
                <div>
                  <strong>Order #{order.id}</strong>
                  <span className="muted"> · {formatDate(order.createdAt)}</span>
                </div>
                <span className={`status status-${order.status?.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>

              <ul className="order-items">
                {order.items?.map((item) => (
                  <li key={item.id ?? `${item.productId}-${item.productName}`}>
                    <span>
                      {item.productName} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.subTotal)}</span>
                  </li>
                ))}
              </ul>

              <div className="order-foot">
                <span className="muted">
                  Ship to: {order.fullName}, {order.city}, {order.country}
                </span>
                <div className="order-foot-right">
                  <span className="price">{formatPrice(order.totalAmount)}</span>
                  {CANCELLABLE.has(order.status) && (
                    <button
                      className="link-danger"
                      onClick={() => handleCancel(order.id)}
                      disabled={busyId === order.id}
                    >
                      {busyId === order.id ? "Cancelling…" : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
