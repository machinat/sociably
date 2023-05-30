import sortPackageJson from 'sort-package-json';
import { when } from '../utils.js';
import { CreateAppContext } from '../types.js';

export default ({
  projectName,
  platforms,
  withWebview,
}: CreateAppContext): string => {
  const packageConfigs = {
    name: projectName,
    private: true,
    scripts: {
      clean: 'rm -rf ./lib ./dist && rm -f tsconfig.tsbuildinfo',

      migrate: 'per-env',
      'migrate:development': 'dotenv -- ts-node ./src/cli/migrate.ts',
      'migrate:production': 'node ./lib/cli/migrate.js',

      build: `npm run clean && npm run build:src${when(
        withWebview
      )` && npm run build:webview`}`,
      'build:src': 'tsc',
      'build:webview': withWebview
        ? 'dotenv -- next build ./webview'
        : undefined,

      start: 'per-env',
      'start:development': 'dotenv -- ts-node ./src/index.ts',
      'start:production': 'node ./lib/index.js',

      dev: 'dotenv -- ts-node ./src/cli/dev.ts',
    },
    dependencies: {
      '@machinat/per-env': '^1.1.0',
      commander: '^8.3.0',
      umzug: '^3.0.0',
    },
    devDependencies: {
      '@types/node': '^17.0.10',
      typescript: '^4.5.5',
      'ts-node': '^10.4.0',
      'dotenv-cli': '^4.1.1',
      nodemon: '^2.0.15',
      localtunnel: '^2.0.2',
    },
  };

  if (withWebview) {
    packageConfigs.dependencies = {
      ...packageConfigs.dependencies,
      ...{
        next: '^12.1.4',
        react: '^17.0.2',
        'react-dom': '^17.0.2',
      },
    };
    packageConfigs.devDependencies['@types/react'] = '^17.0.38';
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
