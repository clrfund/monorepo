module.exports = {
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	parser: 'vue-eslint-parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		parser: '@typescript-eslint/parser',
	},
	plugins: ['vue', '@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:vue/vue3-essential',
		'plugin:@typescript-eslint/recommended',
		'prettier',
		'./.eslintrc-auto-import.json',
	],
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
