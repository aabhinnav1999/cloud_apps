import axios from "axios";

// All requests use same-origin relative "/api/..." paths.
// In dev, vite.config.js proxies each prefix to the right backend service.
const client = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT (if present) to every outgoing request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 (expired / invalid token), clear session and bounce to login.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Pull a human-readable message out of the varied backend error shapes
// (Spring GlobalExceptionHandler -> {message}/{errors}, FastAPI -> {detail}).
export function extractErrorMessage(error, fallback = "Something went wrong") {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.detail) {
    return typeof data.detail === "string"
      ? data.detail
      : JSON.stringify(data.detail);
  }
  if (data.errors) return Object.values(data.errors).join(", ");
  return fallback;
}

export default client;
