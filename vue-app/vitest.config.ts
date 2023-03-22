import { defineConfig } from 'vitest/config'
import path from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
	// @ts-ignore
	plugins: [vue()],
	test: {
		globals: true, // no need to import test api like `import { describe, expect, it } from 'vitest'`
		environment: 'jsdom',
		include: ['src/**/__tests__/*'],
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '/src'),
		},
	},
})
