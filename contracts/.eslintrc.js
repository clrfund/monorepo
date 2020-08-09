module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    "plugin:@typescript-eslint/eslint-recommended",
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    mocha: true,
    node: true,
  },
  rules: {
    'indent': [
      'error',
      2,
    ],
    'comma-dangle': [
      'error',
      'always-multiline',
    ],
    'quotes': [
      'error',
      'single',
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
}
