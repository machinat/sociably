const fs = require('fs');

const inPackagesSourcePattern = `^@sociably/(${fs
  .readdirSync('./packages')
  .join('|')})(.*)$`;

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.spec.[jt]s?(x)'],
  moduleNameMapper: {
    [inPackagesSourcePattern]: '<rootDir>/packages/$1/src$2',
  },
  setupFiles: ['<rootDir>/node_modules/@moxyjs/moxy/lib/extends/jest.js'],
  snapshotSerializers: ['@sociably/jest-snapshot-serializer'],
};
