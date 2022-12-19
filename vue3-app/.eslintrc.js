/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:vue/vue3-essential',
		'@vue/eslint-config-typescript/recommended',
		'@vue/eslint-config-prettier',
		'./.eslintrc-auto-import.json',
	],
	parser: 'vue-eslint-parser',
	parserOptions: {
		ecmaVersion: 'latest',
		parser: {
			'<template>': 'espree',
			ts: '@typescript-eslint/parser',
			js: '@typescript-eslint/parser',
		},
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json'],
		extraFileExtensions: ['.vue'],
	},
	overrides: [
		{
			// enable the rule specifically for TypeScript files
			files: ['*.ts', '*.tsx'],
			parserOptions: {
				parser: '@typescript-eslint/parser',
			},
		},
	],
	rules: {
		'@typescript-eslint/no-unnecessary-condition': ['error'],
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/ban-ts-comment': 'warn',
		'vue/multi-word-component-names': 'warn',
		'vue/no-parsing-error': 'warn', // enable template {{ }} using !
		'prefer-const': 'error',
		'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
	},
	ignorePatterns: ['dist', 'src/graphql/API.ts', 'package.json', '.eslintrc.js', 'vite.config.ts', 'src/locales/*'],
}
