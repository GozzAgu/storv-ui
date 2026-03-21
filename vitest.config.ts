import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/server/**/*.spec.ts', 'tests/integration/**/*.spec.ts'],
    globals: true,
    restoreMocks: true,
    clearMocks: true,
  },
})
