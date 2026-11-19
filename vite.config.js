import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["tests/e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "src/pages/ClientesFrecuentes.jsx",
        "src/pages/Promociones.jsx",
        "src/pages/SegmentacionClientes.jsx",
      ],
      exclude: [
        "**/*.test.*",
        "src/main.jsx",
        "src/__tests__/**",
        "src/test/**",
      ],
    },
  },
});
