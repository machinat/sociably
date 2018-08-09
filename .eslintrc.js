module.exports = {
  parser: 'babel-eslint',
  env: {
    jest: true,
  },
  plugins: [
    'json',
    'prettier',
    'flowtype',
  ],
  extends: [
    'airbnb-base',
    'prettier',
  ],
  rules: {
    strict: 0,
    'no-nested-ternary': 0,
    'no-underscore-dangle': 0,
    'no-unused-vars': ['error', {
      varsIgnorePattern: 'Machinat',
    }],
    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: ['context'],
    }],
    'flowtype/define-flow-type': 1,
    'prettier/prettier': ['error', {
      trailingComma: 'es5',
      singleQuote: true,
      parser: 'babylon',
    }],
    'import/no-unresolved': ['error', {
      ignore: ['types/.+', 'machinat-.+']
    }],
    'import/extensions': 0,
  },
};
