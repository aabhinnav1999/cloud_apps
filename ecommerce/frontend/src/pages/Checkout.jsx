import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { createOrder, cartItemToOrderItem } from "../api/orders.js";
import { extractErrorMessage } from "../api/client.js";

function formatPrice(value) {
  const num = Number(value);
  return Number.isNaN(num) ? value : `$${num.toFixed(2)}`;
}

export default function Checkout() {
  const { cart, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phoneNumber: user?.phoneNumber || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const items = cart?.items || [];

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: items.map(cartItemToOrderItem),
      };
      const order = await createOrder(payload);
      // Order placed — clear the cart, then show the confirmation.
      await clear();
      navigate("/orders", {
        replace: true,
        state: { justPlacedOrderId: order.id },
      });
    } catch (err) {
      setError(extractErrorMessage(err, "Could not place order"));
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="empty-state">
        <h1>Nothing to check out</h1>
        <p className="muted">Add items to your cart first.</p>
        <Link to="/products" className="btn btn-primary">
          Shop products
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h1>Checkout</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Shipping details</h2>
          <div className="form-grid">
            <label>
              Full name
              <input name="fullName" value={form.fullName} onChange={handleChange} required />
            </label>
            <label>
              Phone number
              <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required />
            </label>
            <label className="span-2">
              Address line 1
              <input name="addressLine1" value={form.addressLine1} onChange={handleChange} required />
            </label>
            <label className="span-2">
              Address line 2 <span className="muted">(optional)</span>
              <input name="addressLine2" value={form.addressLine2} onChange={handleChange} />
            </label>
            <label>
              City
              <input name="city" value={form.city} onChange={handleChange} required />
            </label>
            <label>
              State
              <input name="state" value={form.state} onChange={handleChange} required />
            </label>
            <label>
              Country
              <input name="country" value={form.country} onChange={handleChange} required />
            </label>
            <label>
              Postal code
              <input name="postalCode" value={form.postalCode} onChange={handleChange} required />
            </label>
          </div>
          <button className="btn btn-primary full" type="submit" disabled={submitting}>
            {submitting ? "Placing order…" : `Place order · ${formatPrice(cart.totalAmount)}`}
          </button>
        </form>

        <aside className="cart-summary">
          <h2>Order summary</h2>
          <ul className="summary-items">
            {items.map((item) => (
              <li key={item.productId}>
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatPrice(Number(item.price) * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(cart.totalAmount)}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
