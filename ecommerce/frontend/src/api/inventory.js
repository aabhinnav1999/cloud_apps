import client from "./client.js";

// GET /api/inventory/{productId}
// -> { id, product_id, total_quantity, reserved_quantity, available_quantity }
// Returns available_quantity, or null when no inventory record exists (404).
export async function fetchAvailableStock(productId) {
  try {
    const { data } = await client.get(`/api/inventory/${productId}`);
    return data.available_quantity;
  } catch (err) {
    if (err?.response?.status === 404) {
      return null; // product has no inventory record yet
    }
    throw err;
  }
}
