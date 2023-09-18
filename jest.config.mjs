import fs from 'fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkgNamesMatcher = `(${fs.readdirSync('./packages').join('|')})`;

const baseConfigs = {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '\\.tsx?$': [
      '@swc/jest',
      {
        jsc: {
          transform: {
            react: {
              pragma: 'Sociably.createElement',
              pragmaFrag: 'Sociably.Fragment',
            },
          },
        },
      },
    ],
    '\\.jsx?$': 'babel-jest',
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    [`^@sociably/${pkgNamesMatcher}(.*)$`]: '<rootDir>/packages/$1/src$2',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFiles: ['<rootDir>/node_modules/@moxyjs/moxy/lib/extends/jest.js'],
  setupFilesAfterEnv: [
    '<rootDir>/node_modules/@sociably/jest-snapshot-serializer/lib/index.js',
  ],
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!camelcase-keys|camelcase|node-fetch|@moxyjs/moxy|data-uri-to-buffer|fetch-blob|formdata-polyfill)',
  ],
  prettierPath: require.resolve('prettier-2'),
};

export default {
  projects: [
    {
      ...baseConfigs,
      testMatch: [
        '**/__tests__/**/*.spec.[jt]s?(x)',
        '!**/packages/postgres-state/**',
      ],
    },
    {
      ...baseConfigs,
      displayName: 'PG',
      testMatch: [
        '<rootDir>/packages/postgres-state/**/__tests__/**/*.spec.[jt]s?(x)',
      ],
      globalSetup: '<rootDir>/node_modules/@databases/pg-test/jest/globalSetup',
      globalTeardown:
        '<rootDir>/node_modules/@databases/pg-test/jest/globalTeardown',
    },
  ],
};
