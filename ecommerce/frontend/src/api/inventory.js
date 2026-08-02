import client from "./client.js";

// inventory-service (raw JSON, no wrapper).
// InventoryResponse: { id, product_id, total_quantity, reserved_quantity, available_quantity }

// GET /api/inventory/{productId}
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

// GET /api/inventory/{productId} -> full record, or null on 404.
export async function fetchInventory(productId) {
  try {
    const { data } = await client.get(`/api/inventory/${productId}`);
    return data;
  } catch (err) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

// POST /api/inventory/ { product_id, total_quantity } -> InventoryResponse
export async function createInventory(productId, totalQuantity) {
  const { data } = await client.post("/api/inventory/", {
    product_id: productId,
    total_quantity: totalQuantity,
  });
  return data;
}

// PUT /api/inventory/{productId} { total_quantity } -> InventoryResponse
export async function updateInventory(productId, totalQuantity) {
  const { data } = await client.put(`/api/inventory/${productId}`, {
    total_quantity: totalQuantity,
  });
  return data;
}

// Create the record if missing, otherwise update it.
export async function setInventory(productId, totalQuantity) {
  const existing = await fetchInventory(productId);
  return existing
    ? updateInventory(productId, totalQuantity)
    : createInventory(productId, totalQuantity);
}
