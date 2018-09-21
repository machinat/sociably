module.exports = {
  presets: [
    '@babel/preset-flow',
    ['@babel/preset-env', {
        targets: {
          node: '6.10',
        },
    }],
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    ['@babel/plugin-transform-react-jsx', {
        pragma: 'Machinat.createElement',
        pragmaFrag: 'Machinat.Fragment',
    }],
  ],
};
