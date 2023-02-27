const fs = require('fs');

const inPackagesSourcePattern = `^@sociably/(${fs
  .readdirSync('./packages')
  .join('|')})(.*)$`;

const baseConfigs = {
  testEnvironment: 'node',
  moduleNameMapper: {
    [inPackagesSourcePattern]: '<rootDir>/packages/$1/src$2',
  },
  setupFiles: ['<rootDir>/node_modules/@moxyjs/moxy/lib/extends/jest.js'],
  snapshotSerializers: ['@sociably/jest-snapshot-serializer'],
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!camelcase-keys|camelcase|quick-lru)',
  ],
};

module.exports = {
  projects: [
    {
      ...baseConfigs,
      name: 'basic-tests',
      testMatch: [
        '**/__tests__/**/*.spec.[jt]s?(x)',
        '!**/packages/postgres-state/**',
      ],
    },
    {
      ...baseConfigs,
      name: 'pg-tests',
      testMatch: [
        '<rootDir>/packages/postgres-state/**/__tests__/**/*.spec.[jt]s?(x)',
      ],
      globalSetup: '<rootDir>/node_modules/@databases/pg-test/jest/globalSetup',
      globalTeardown:
        '<rootDir>/node_modules/@databases/pg-test/jest/globalTeardown',
    },
  ],
};
