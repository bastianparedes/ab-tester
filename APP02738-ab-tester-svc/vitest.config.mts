import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        branches: 95,
        functions: 99,
        lines: 99,
        statements: 99,
      },
    },
    environment: 'node',
    hookTimeout: 30_000,
    include: ['src/**/__tests__/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  },
});
