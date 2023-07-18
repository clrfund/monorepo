import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import nodeStdlibBrowser from 'node-stdlib-browser'
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
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src'), ...nodeStdlibBrowser },
  },
  optimizeDeps: {
    include: ['@clrfund/maci-utils'],
    esbuildOptions: {
      target: 'esnext', // to enable nable Big integer literals
      inject: [require.resolve('node-stdlib-browser/helpers/esbuild/shim')],
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
          maci: ['@clrfund/maci-utils'],
          qrcode: ['qrcode'],
        },
      },
      plugins: [
        inject({
          global: [require.resolve('node-stdlib-browser/helpers/esbuild/shim'), 'global'],
          process: [require.resolve('node-stdlib-browser/helpers/esbuild/shim'), 'process'],
          Buffer: [require.resolve('node-stdlib-browser/helpers/esbuild/shim'), 'Buffer'],
        }),
      ],
    },
  },
})
