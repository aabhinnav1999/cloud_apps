import client from "./client.js";

// cart-service wraps every response as { success, message, data }.
// These helpers return the unwrapped cart object (data) directly.

// GET /api/cart -> cart { userEmail, items[], totalItems, totalQuantity, totalAmount }
export async function fetchCart() {
  const { data } = await client.get("/api/cart");
  return data.data;
}

// POST /api/cart/items { productId, name, brand, price, imageUrl, quantity }
export async function addCartItem(item) {
  const { data } = await client.post("/api/cart/items", item);
  return data.data;
}

// PUT /api/cart/items/:productId { quantity }
export async function updateCartItem(productId, quantity) {
  const { data } = await client.put(`/api/cart/items/${productId}`, { quantity });
  return data.data;
}

// DELETE /api/cart/items/:productId
export async function removeCartItem(productId) {
  const { data } = await client.delete(`/api/cart/items/${productId}`);
  return data.data;
}

// DELETE /api/cart  (clears the whole cart; returns no cart body)
export async function clearCart() {
  await client.delete("/api/cart");
}

export const EMPTY_CART = {
  items: [],
  totalItems: 0,
  totalQuantity: 0,
  totalAmount: 0,
};
