import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/prisma-setup.ts", "./tests/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    alias: {
      "@": path.resolve(__dirname, "."),
    },
    pool: "forks",
    fileParallelism: false,
  },
});
