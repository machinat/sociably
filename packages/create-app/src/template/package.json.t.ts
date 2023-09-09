import sortPackageJson from 'sort-package-json';
import { when } from '../utils.js';
import { CreateAppContext } from '../types.js';

export default ({
  projectName,
  platforms,
  withWebview,
}: CreateAppContext): string => {
  // NOTE: @sociably deps are installed at runtime through `npm install`
  const packageConfigs = {
    name: projectName,
    private: true,
    type: 'module',
    scripts: {
      clean: 'rm -rf ./lib ./dist && rm -f tsconfig.tsbuildinfo',

      build: `npm run clean && npm run build:src${when(
        withWebview,
      )` && npm run build:webview`}`,
      'build:src': 'tsc',
      'build:webview': withWebview
        ? 'dotenv -- next build ./webview'
        : undefined,

      start: 'per-env',
      'start:development': 'dotenv -- ts-node-esm ./src/index.ts',
      'start:production': 'node ./lib/index.js',

      dev: 'nodemon ./src/index.ts',

      migrate: 'per-env',
      'migrate:development': 'dotenv -- ts-node-esm ./src/cli/migrate.ts',
      'migrate:production': 'node ./lib/cli/migrate.js',
    },
    dependencies: {
      '@machinat/per-env': '^1.1.0',
      commander: '^8.3.0',
      umzug: '^3.0.0',
    },
    devDependencies: {
      '@types/node': '^20.4.5',
      'dotenv-cli': '^7.2.1',
      localtunnel: '^2.0.2',
      nodemon: '^3.0.1',
      'ts-node': '^10.9.1',
      typescript: '^5.1.3',
    },
    nodemonConfig: {
      exec: './node_modules/.bin/ts-node-esm -r dotenv/config',
      watch: ['./src', './.env'],
      ext: 'ts,tsx',
      verbose: true,
      delay: 2000,
    },
  };

  if (withWebview) {
    packageConfigs.dependencies = {
      ...packageConfigs.dependencies,
      ...{
        next: '^13.4.0',
        react: '^18.0.0',
        'react-dom': '^18.0.0',
      },
    };
    packageConfigs.devDependencies['@types/react'] = '^18.0.0';
  }

  if (platforms.includes('instagram')) {
    packageConfigs.scripts = {
      ...packageConfigs.scripts,
      ...{
        getInstagramAgentAccount: 'per-env',
        'getInstagramAgentAccount:development':
          'dotenv -- ts-node-esm ./src/cli/getInstagramAgentAccount.ts',
        'getInstagramAgentAccount:production':
          'node ./lib/cli/getInstagramAgentAccount.js',
      },
    };
  }

  if (platforms.includes('twitter')) {
    packageConfigs.scripts = {
      ...packageConfigs.scripts,
      ...{
        activateTwitterWebhook: 'per-env',
        'activateTwitterWebhook:development':
          'dotenv -- ts-node ./src/cli/activateTwitterWebhook.ts',
        'activateTwitterWebhook:production':
          'node ./lib/cli/activateTwitterWebhook.js',
      },
    };
  }

  return JSON.stringify(sortPackageJson(packageConfigs), null, 2);
};
