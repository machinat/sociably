module.exports = {
  presets: [
    '@babel/preset-flow',
    ['@babel/preset-env', {
        targets: {
          node: '7.6',
        },
    }],
  ],
  plugins: [
    'babel-plugin-dev-expression',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-optional-chaining',
    ['@babel/plugin-transform-react-jsx', {
        pragma: 'Machinat.createElement',
        pragmaFrag: 'Machinat.Fragment',
    }],
  ],
  env: {
    production: {
      "ignore": [
        "**/__tests__",
        "**/__mocks__",
      ],
    },
  },
};
