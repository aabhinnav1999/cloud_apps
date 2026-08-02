import client from "./client.js";

// product-service (raw JSON, no wrapper).

// GET /api/categories -> [{ id, name }]
export async function fetchCategories() {
  const { data } = await client.get("/api/categories");
  return data;
}

// POST /api/categories { name } -> 201 { id, name }
export async function createCategory(name) {
  const { data } = await client.post("/api/categories", { name });
  return data;
}

// POST /api/products -> 201 ProductResponse
export async function createProduct(payload) {
  const { data } = await client.post("/api/products", payload);
  return data;
}
