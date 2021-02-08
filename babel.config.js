module.exports = {
  presets: [
    ['@babel/preset-typescript', {
      isTSX: true,
      allExtensions: true,
      jsxPragma: 'Machinat',
      allowNamespaces: true,
      onlyRemoveTypeImports: true,
    }],
    ['@babel/preset-env', {
        targets: { node: 10 },
    }],
    '@machinat/babel-preset',
  ],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
  ],
  env: {
    production: {
      ignore: [
        "**/__tests__",
        "**/__mocks__",
      ],
    },
  },
};
