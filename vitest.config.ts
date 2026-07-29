import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["registry/**/*.test.tsx", "lib/**/*.test.ts", "components/**/*.test.tsx"],
    passWithNoTests: true,
    // userEvent types character-by-character; the phone-input suite is ~3.6s on an
    // idle machine and blows the 5s default under CPU contention. Not async flake.
    testTimeout: 15_000,
  },
})
