import { defineConfig, type Plugin } from 'vitest/config'

function resolveRelativeTypeScript(): Plugin {
  return {
    name: 'resolve-relative-typescript',
    async resolveId(source, importer, options) {
      if (!importer || !source.startsWith('.')) return null

      let candidate = source
      if (source.endsWith('.js')) {
        candidate = `${source.slice(0, -3)}.ts`
      } else if (!/\.[a-zA-Z0-9]+$/.test(source)) {
        candidate = `${source}.ts`
      }

      if (candidate === source) return null
      return this.resolve(candidate, importer, { skipSelf: true, ...options })
    },
  }
}

export default defineConfig({
  plugins: [resolveRelativeTypeScript()],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
