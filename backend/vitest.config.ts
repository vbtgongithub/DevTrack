import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**', 'tests/**', 'src/__tests__/integration/**'],
    passWithNoTests: true,
    setupFiles: ['./src/__tests__/vitest.setup.ts'],
  },
});
