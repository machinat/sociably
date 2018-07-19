module.exports = {
  parser: 'babel-eslint',
  env: {
    jest: true,
  },
  plugins: [
    'json',
    'prettier'
  ],
  extends: [
    'airbnb-base',
    'prettier',
  ],
  rules: {
    strict: 0,
    'prettier/prettier': ['error', {
      trailingComma: 'es5',
      singleQuote: true,
    }],
    'no-nested-ternary': 0,
  },
};
