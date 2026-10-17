import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        branches: 96.35,
        functions: 99.6,
        lines: 99.94,
        statements: 99.69,
      },
    },
    environment: 'node',
    hookTimeout: 30_000,
    include: ['src/**/__tests__/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  },
});
