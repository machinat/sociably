module.exports = {
  presets: [
    ['@babel/preset-typescript', {
      isTSX: true,
      allExtensions: true,
      jsxPragma: 'Machinat',
      onlyRemoveTypeImports: true,
    }],
    ['@babel/preset-env', {
        targets: {
          node: '8',
        },
    }],
    '@machinat/babel-preset',
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
