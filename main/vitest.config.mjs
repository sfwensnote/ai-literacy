import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'threads',
    maxWorkers: 1,
    exclude: ['node_modules/**', '.next/**', 'tests/e2e/**'],
  },
})
