const path = require('path');

module.exports = {
  parser: 'babel-eslint',
  env: {
    jest: true,
  },
  globals: {
    __DEV__: false
  },
  plugins: [
    'json',
    'prettier',
    'flowtype',
  ],
  extends: [
    'airbnb-base',
    'prettier',
    'plugin:react/recommended',
  ],
  rules: {
    strict: 0,
    'no-nested-ternary': 0,
    'no-underscore-dangle': 0,
    'no-unused-vars': ['error', {
      ignoreRestSiblings: true,
    }],
    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: ['context'],
    }],
    'no-restricted-syntax': ['error',
      'ForInStatement', 'LabeledStatement', 'WithStatement'
    ],
    'flowtype/define-flow-type': 1,
    'prettier/prettier': ['error', {
      trailingComma: 'es5',
      singleQuote: true,
      parser: 'babylon',
    }],
    'import/extensions': 0,
    'import/no-unresolved': ['error', {
      ignore: ['types/.+', 'machinat-.+']
    }],
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: ['**/*.spec.js'],
      packagePath: ['./', '../../'],
    }],
    'react/jsx-key': 0,
    'react/no-unescaped-entities': ['error', {
      forbid: ['<', '>', '{', '}']
    }],
  },
  settings:{
    react: {
      pragma: 'Machinat',
    },
  }
};
