import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The frontend calls same-origin "/api/..." paths. In dev, Vite proxies ALL of
// them to the API gateway (single entry point), which routes to each service.
//
// Set VITE_API_TARGET to override (e.g. a deployed gateway). If you're NOT
// running the gateway, point this at an individual service, or restore the
// per-service proxy rules (see the git history of this file).
const API_TARGET = process.env.VITE_API_TARGET || "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: API_TARGET, // api-gateway
        changeOrigin: true,
      },
    },
  },
});
