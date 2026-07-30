import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev proxy: the browser talks only to the Vite dev server (same origin),
// which forwards each API prefix to the correct backend service.
// This avoids CORS configuration on the services during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api/auth": {
        target: "http://localhost:8081", // user-service
        changeOrigin: true,
      },
      "/api/users": {
        target: "http://localhost:8081", // user-service
        changeOrigin: true,
      },
      "/api/products": {
        target: "http://localhost:8082", // product-service
        changeOrigin: true,
      },
      "/api/categories": {
        target: "http://localhost:8082", // product-service
        changeOrigin: true,
      },
      "/api/cart": {
        target: "http://localhost:8083", // cart-service
        changeOrigin: true,
      },
      "/api/inventory": {
        target: "http://localhost:8084", // inventory-service
        changeOrigin: true,
      },
      "/api/orders": {
        target: "http://localhost:8085", // order-service
        changeOrigin: true,
      },
    },
  },
});
