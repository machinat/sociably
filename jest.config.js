module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.spec.[jt]s?(x)'],
  moduleNameMapper: {
    '^@machinat/([^/]*)(.*)$': '<rootDir>/packages/machinat-$1/src$2',
  },
  setupFiles: ['<rootDir>/node_modules/@moxyjs/moxy/lib/extends/jest.js'],
  snapshotSerializers: ['@machinat/jest-snapshot-serializer'],
};
