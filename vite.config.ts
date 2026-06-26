import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react()
  ],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: true,
    fs: {
      deny: ["reference"],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  optimizeDeps: {
    entries: ["index.html"],
  },
  build: {
    target: "es2021",
    minify: "oxc",
    sourcemap: true,
  },
});