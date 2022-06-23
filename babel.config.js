module.exports = {
  presets: [
    ['@babel/preset-typescript', {
      isTSX: true,
      allExtensions: true,
      jsxPragma: 'Sociably',
      allowNamespaces: true,
      onlyRemoveTypeImports: true,
    }],
    ['@babel/preset-env', {
        targets: { node: 10 },
        loose: true,
    }],
  ],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    '@babel/plugin-syntax-jsx',
    ['@babel/plugin-transform-react-jsx', {
      pragma: 'Sociably.createElement',
      pragmaFrag: 'Sociably.Fragment',
    }],
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
