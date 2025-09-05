import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // 🔧 THIS is the fix
    port: 5173, // Ensure this matches your docker-compose
    proxy: {
      "/api": {
        target: "http://backend:3000", // this is fine due to Docker setup
        changeOrigin: true,
      },
    },
  },
});
