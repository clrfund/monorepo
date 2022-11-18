module.exports = {
	root: true,
	env: {
		'vue/setup-compiler-macros': true,
		node: true,
	},
	extends: ['plugin:vue/vue3-essential', 'eslint:recommended', '@vue/typescript/recommended'],
	parserOptions: {
		ecmaVersion: 2020,
	},
	rules: {
		'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'@typescript-eslint/ban-ts-comment': 'warn',
		'@typescript-eslint/no-explicit-any': 'off',
		'vue/multi-word-component-names': 'warn',
		'no-mixed-spaces-and-tabs': 'warn',
	},
	overrides: [
		{
			files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
			env: {
				mocha: true,
			},
		},
	],
}
