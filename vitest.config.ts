import { defineConfig } from 'vitest/config'

// Unit tests for both apps (storefront src/ and admin/src/) run from the repo root.
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'admin/src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
