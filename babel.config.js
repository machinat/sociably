module.exports = {
  presets: [
    '@babel/preset-typescript',
    ['@babel/preset-env', {
        targets: {
          node: '8',
        },
    }],
    '@machinat/babel-preset',
  ],
  plugins: [
    'babel-plugin-dev-expression',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-optional-chaining',
    ['@babel/plugin-proposal-decorators', {
      legacy: true,
    }],
    ['@babel/plugin-proposal-class-properties', {
      loose: true,
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
