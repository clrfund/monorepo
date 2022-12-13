import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import rollupPolyfillNode from 'rollup-plugin-polyfill-node'
import nodeStdlibBrowser from 'node-stdlib-browser'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

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
	],
	resolve: {
		// Enable polyfill node used in development to prevent from vite's browser compatibility warning
		alias: { '@': path.resolve(__dirname, 'src'), ...nodeStdlibBrowser },
	},
	optimizeDeps: {
		// Enable polyfill node used in development, refer to https://github.com/sodatea/vite-plugin-node-stdlib-browser/blob/b17f417597c313ecd52c3e420ba8fc33bcbdae20/index.cjs#L17
		esbuildOptions: {
			inject: [require.resolve('node-stdlib-browser/helpers/esbuild/shim')],
			target: 'esnext', // Enable Big integer literals
		},
	},
	build: {
		target: 'esnext', // Enable Big integer literals
		rollupOptions: {
			plugins: [
				// Enable rollup polyfills plugin used in production bundling, refer to https://stackoverflow.com/a/72440811/10752354
				rollupPolyfillNode(),
			],
		},
		commonjsOptions: {
			transformMixedEsModules: true, // Enable @walletconnect/web3-provider which has some code in CommonJS
		},
	},
})
