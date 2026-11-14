import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/plant-garden-tracker/" : "/",
  server: { port: 5173, allowedHosts: ["fix-workspace-preview-error-web.v0.build"] },
}));
