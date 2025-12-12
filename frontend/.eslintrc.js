// frontend/.eslintrc.js
module.exports = {
  env: { browser: true, es2021: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended'
  ],
  plugins: ['react', 'react-hooks'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  settings: { react: { version: 'detect' } },
  rules: {
    // Relax prop-types checks (you can re-enable later and add propTypes)
    'react/prop-types': 'off',

    // Don't treat missing dependencies in hooks as fatal (you can keep the rule on warn)
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',

    // Avoid failing on unused vars during development — warn instead.
    'no-unused-vars': ['warn', { vars: 'all', args: 'none', ignoreRestSiblings: true }],

    // disable strict no-unescaped-entities rule that often flags JSX strings
    'react/no-unescaped-entities': 'off',

    // keep other recommended defaults
    'no-console': 'off'
  }
};
