import client from "./client.js";

// notification-service wraps responses as { success, data, ... }.

// GET /api/notifications/user/:userId -> { success, count, data: [...] }
// userId is the customer's email (matches what order-service emits).
export async function fetchUserNotifications(userId) {
  const { data } = await client.get(
    `/api/notifications/user/${encodeURIComponent(userId)}`
  );
  return data.data || [];
}

// POST /api/notifications/ -> { success, data }
export async function createNotification(payload) {
  const { data } = await client.post("/api/notifications/", payload);
  return data.data;
}

// PATCH /api/notifications/:id/read -> { success, data }
export async function markNotificationRead(id) {
  const { data } = await client.patch(`/api/notifications/${id}/read`);
  return data.data;
}

// DELETE /api/notifications/:id
export async function deleteNotification(id) {
  await client.delete(`/api/notifications/${id}`);
}
