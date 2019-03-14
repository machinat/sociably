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
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'prettier/flowtype',
    'prettier/react',
    'prettier/standard',
  ],
  rules: {
    strict: 0,
    'no-nested-ternary': 0,
    'no-underscore-dangle': 0,
    'no-unused-vars': ['error', {
      ignoreRestSiblings: true,
    }],
    'no-unused-expressions': 0,
    'flowtype/no-unused-expressions': 2,
    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: ['context', 'ctx', 'frame'],
    }],
    'no-restricted-syntax': ['error',
      'ForInStatement', 'LabeledStatement', 'WithStatement'
    ],
    'flowtype/define-flow-type': 1,
    'import/extensions': 0,
    'import/no-unresolved': ['error', {
      ignore: ['machinat.*/types']
    }],
    'react/jsx-key': 0,
    'react/no-unescaped-entities': ['error', {
      forbid: ['<', '>', '{', '}']
    }],
  },
  overrides: [
    {
      files: '**/__{tests,fixtures,mocks}__/*',
      rules: {
        'import/no-extraneous-dependencies': 0
      }
    }
  ],
  settings:{
    react: {
      pragma: 'Machinat',
    },
  }
};
