module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  extends: [
    'prettier',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    tsconfigRootDir: __dirname,
    project: ['tsconfig.eslint.json'],
  },
  plugins: ['@typescript-eslint'],
  rules: { '@typescript-eslint/no-unsafe-assignment': 'off' },
  ignorePatterns: [
    '.prettierrc.cjs',
    '.eslintrc.cjs',
    'jest.config.cjs',
    'package.json',
    'tsconfig.json',
    'tsconfig.eslint.json',
    'package-lock.json',
    'cdk.json',
  ],
}
