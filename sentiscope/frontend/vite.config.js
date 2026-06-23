import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The frontend talks to the Node backend. During development we proxy any
// request starting with /api to the backend so we avoid CORS issues and can
// use relative URLs in the React code.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5050",
        changeOrigin: true,
      },
    },
  },
});
