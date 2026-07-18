import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    /* happy-dom: supports Vue SFC component tests alongside pure Node-style unit tests */
    environment: 'happy-dom',
    include: [
      'tests/server/**/*.spec.ts',
      'tests/integration/**/*.spec.ts',
      'tests/unit/**/*.spec.ts',
      'tests/rules/**/*.spec.ts',
    ],
    globals: true,
    restoreMocks: true,
    clearMocks: true,
  },
})
