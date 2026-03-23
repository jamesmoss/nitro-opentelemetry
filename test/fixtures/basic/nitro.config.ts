import { defineNitroConfig } from 'nitro/config'
import '../../../src/augment'

export default defineNitroConfig({
  serverDir: './',
  imports: {},
  modules: [
      'nitro-opentelemetry'
  ],

  otel: {
      preset: {
          name: 'custom',
          filePath: ('./init.ts')
      }
  },

  compatibilityDate: '2025-01-09'
})