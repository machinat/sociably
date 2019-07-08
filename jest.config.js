module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.spec.js?(x)'],
  globals: {
    __DEV__: true,
  },
  moduleNameMapper: {
    '^(machinat-?[^/]*)$': '<rootDir>/packages/$1/src',
  },
  setupFiles: ['<rootDir>/node_modules/moxy/lib/extends/jest.js'],
};
