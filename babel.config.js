module.exports = {
  presets: [
    [
      '@babel/preset-typescript',
      {
        isTSX: true,
        allExtensions: true,
        allowNamespaces: true,
        onlyRemoveTypeImports: true,
      },
    ],
    [
      '@babel/preset-env',
      {
        targets: { node: 16 },
        loose: true,
      },
    ],
  ],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    '@babel/plugin-syntax-jsx',
    [
      '@babel/plugin-transform-react-jsx',
      {
        runtime: 'automatic',
        importSource: '@sociably/core',
      },
    ],
  ],
  env: {
    production: {
      ignore: ['**/__tests__', '**/__mocks__'],
    },
  },
};
