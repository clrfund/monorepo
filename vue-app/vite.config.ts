import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import inject from '@rollup/plugin-inject'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [
    vue(),
    // https://github.com/antfu/unplugin-auto-import#configuration
    AutoImport({
      dts: 'src/auto-import.d.ts',
      imports: ['vue', 'vue-router', 'pinia', 'vue-i18n'],
      eslintrc: {
        enabled: true,
      },
    }),
    // https://github.com/antfu/unplugin-vue-components#configuration
    Components({
      dts: 'src/components.d.ts',
    }),
    VueI18nPlugin({
      // https://stackoverflow.com/questions/75315371/vue-i18n-not-substituting-tokens-in-production-build
      runtimeOnly: false,
    }),
    nodePolyfills({
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  optimizeDeps: {
    include: ['@clrfund/common'],
    esbuildOptions: {
      target: 'esnext', // to enable nable Big integer literals
    },
  },
  build: {
    target: 'esnext', // to enable Big integer literals
    chunkSizeWarningLimit: 6300,
    rollupOptions: {
      output: {
        manualChunks: {
          'google-spreadsheet': ['google-spreadsheet'],
          '@kleros/gtcr-encoder': ['@kleros/gtcr-encoder'],
          '@vuelidate': ['@vuelidate/core', '@vuelidate/validators'],
          common: ['@clrfund/common'],
          qrcode: ['qrcode'],
        },
      },
    },
  },
})
