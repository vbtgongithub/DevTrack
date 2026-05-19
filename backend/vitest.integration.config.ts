import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/integration/**/*.test.ts'],
    exclude: ['dist/**'],
    setupFiles: ['src/__tests__/integration/setup.ts'],
    passWithNoTests: true,
    fileParallelism: false, // Don't run integration tests in parallel due to DB sharing
  },
});
