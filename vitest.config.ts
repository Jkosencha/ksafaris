import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // Database tests share one test database, so run files one at a time.
    fileParallelism: false,
    // Neon is in Europe: each round trip takes about 0.2 s, and setup rebuilds the
    // test database from the migrations, so allow generous time.
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
