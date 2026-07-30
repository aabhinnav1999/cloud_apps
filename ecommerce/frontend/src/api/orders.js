import client from "./client.js";

// order-service returns raw JSON (no wrapper).

// POST /api/orders -> created OrderResponse
export async function createOrder(payload) {
  const { data } = await client.post("/api/orders", payload);
  return data;
}

// GET /api/orders -> OrderResponse[] (newest first)
export async function fetchMyOrders() {
  const { data } = await client.get("/api/orders");
  return data;
}

// GET /api/orders/:id -> OrderResponse
export async function fetchOrder(orderId) {
  const { data } = await client.get(`/api/orders/${orderId}`);
  return data;
}

// PUT /api/orders/:id/cancel -> OrderResponse
export async function cancelOrder(orderId) {
  const { data } = await client.put(`/api/orders/${orderId}/cancel`);
  return data;
}

// Map a cart item (name/imageUrl) to an order item (productName) the
// order-service CreateOrderRequest expects.
export function cartItemToOrderItem(item) {
  return {
    productId: item.productId,
    productName: item.name,
    brand: item.brand,
    price: item.price,
    quantity: item.quantity,
  };
}
