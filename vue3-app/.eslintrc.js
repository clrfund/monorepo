/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
	root: true,
	extends: [
		'plugin:vue/vue3-essential',
		'eslint:recommended',
		'@vue/eslint-config-typescript',
		'@vue/eslint-config-prettier',
		'./.eslintrc-auto-import.json',
	],
	parserOptions: {
		ecmaVersion: 'latest',
	},
	overrides: [],
	rules: {
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/ban-ts-comment': 'warn',
		'vue/multi-word-component-names': 'warn',
		'prefer-const': 'error',
		'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
	},
	ignorePatterns: ['dist', 'src/graphql/API.ts'],
}
