module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.spec.js?(x)'],
  globals: {
    __DEV__: true,
  },
  moduleNameMapper: {
    '^@machinat/([^/]*)(.*)$': '<rootDir>/packages/machinat-$1/src$2',
  },
  setupFiles: ['<rootDir>/node_modules/moxy/lib/extends/jest.js'],
  snapshotSerializers: ['@machinat/jest-snapshot-serielizer'],
};
