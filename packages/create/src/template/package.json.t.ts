import sortPackageJson from 'sort-package-json';
import { when, polishFileContent } from '../templateHelper';
import { CreateAppContext } from '../types';

export default ({ projectName, platforms }: CreateAppContext) => {
  const packageConfigs = {
    name: projectName,
    verion: '0.0.1',
    private: true,
    scripts: {
      clean: 'rm -rf ./lib ./dist && rm tsconfig.tsbuildinfo',

      migrate: 'per-env',
      'migrate:development': 'ts-node ./src/cli/migrate.ts',
      'migrate:production': 'node ./lib/cli/migrate.js',

      build: `npm run build:source${when(
        platforms.includes('webview')
      )` && npm run build:webview`}`,
      'build:source': 'tsc',
      'build:webview': 'next build ./src/webview',

      start: 'per-env',
      'start:development': 'ts-node ./src/index.ts',
      'start:production': 'node ./lib/index.js',

      dev: 'ts-node ./src/cli/dev.ts',
    },
    dependencies: {
      '@machinat/core': 'latest',
      '@machinat/http': 'latest',
      '@machinat/local-state': 'latest',
      '@machinat/redis-state': 'latest',
      '@machinat/stream': 'latest',
      '@machinat/messenger': platforms.includes('messenger')
        ? 'latest'
        : undefined,
      '@machinat/telegram': platforms.includes('telegram')
        ? 'latest'
        : undefined,
      '@machinat/line': platforms.includes('line') ? 'latest' : undefined,
      commander: '^7.2.0',
      dotenv: '^8.2.0',
      'per-env': 'github:machinat/per-env',
      umzug: '^3.0.0-beta.15',
    },
    devDependencies: {
      '@types/node': '^14.14.41',
      nodemon: '^2.0.7',
      'ts-node': '^9.1.1',
      typescript: '^4.2.4',
      localtunnel: '^2.0.1',
    },
  };

  if (platforms.includes('webview')) {
    packageConfigs.dependencies = {
      ...packageConfigs.dependencies,
      ...{
        '@machinat/webview': 'latest',
        next: '^10.1.3',
        react: '^17.0.2',
        'react-dom': '^17.0.2',
      },
    };

    packageConfigs.devDependencies['@types/react'] = '^17.0.2';
  }

  return polishFileContent(
    JSON.stringify(sortPackageJson(packageConfigs), null, 2)
  );
};
