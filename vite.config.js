
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";


import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    exclude: ["tests/e2e/**", "node_modules/**"],
    coverage: {

      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/pages/Ventas.jsx'],
      exclude: ['src/main.jsx', 'src/__tests__/**', 'src/test/**'],

      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "src/pages/DesempenoRepartidores.jsx",
        "src/pages/Ventas.jsx",
        "src/pages/Home.jsx",
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