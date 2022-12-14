import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import nodeStdlibBrowser from 'node-stdlib-browser'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import inject from '@rollup/plugin-inject'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		// https://github.com/antfu/unplugin-auto-import#configuration
		AutoImport({
			dts: 'src/auto-import.d.ts',
			imports: ['vue', 'vue-router', 'pinia'],
			eslintrc: {
				enabled: true,
			},
		}),
		// https://github.com/antfu/unplugin-vue-components#configuration
		Components({
			dts: 'src/components.d.ts',
		}),
		// https://github.com/niksy/node-stdlib-browser#vite
		{
			...inject({
				global: [require.resolve('node-stdlib-browser/helpers/esbuild/shim'), 'global'],
				process: [require.resolve('node-stdlib-browser/helpers/esbuild/shim'), 'process'],
				Buffer: [require.resolve('node-stdlib-browser/helpers/esbuild/shim'), 'Buffer'],
			}),
			enforce: 'post',
		},
	],
	resolve: {
		// Enable polyfill node used in development to prevent from vite's browser compatibility warning
		alias: { '@': path.resolve(__dirname, 'src'), ...nodeStdlibBrowser },
	},
	optimizeDeps: {
		esbuildOptions: {
			target: 'esnext', // Enable Big integer literals
		},
	},
	build: {
		target: 'esnext', // Enable Big integer literals
		commonjsOptions: {
			transformMixedEsModules: true, // Enable @walletconnect/web3-provider which has some code in CommonJS
		},
	},
})
