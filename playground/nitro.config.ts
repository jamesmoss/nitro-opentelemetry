//https://nitro.build/config
import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  serverDir: "server",
  modules: [
    '../src/module.ts'
  ],
  compatibilityDate: '2025-01-03'
});
