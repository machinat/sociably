import { CreateAppContext } from '../../../types';
import { when } from '../../../utils';

export const mode = 0o775;

export default ({ platforms }: CreateAppContext) => `
#!/usr/bin/env node
import { resolve as resolvePath } from 'path';
import Machinat from '@machinat/core';${when(platforms.includes('messenger'))`
import Messenger from '@machinat/messenger';`}${when(
  platforms.includes('telegram')
)`
import Telegram from '@machinat/telegram';`}${when(platforms.includes('line'))`
import Line from '@machinat/line';`}
import { Umzug, JSONStorage } from 'umzug';
import { program } from 'commander';
import createApp from '../app';

const app = createApp({ noServer: true });

const umzug = new Umzug({
  storage: new JSONStorage({
    path: resolvePath('./.executed_migrations.json'),
  }),
  logger: console,
  migrations: {
    glob: resolvePath(
      __dirname,
      \`../migrations/*.\${__dirname.includes('/src/') ? 'ts' : 'js'}\`
    ),
    resolve: ({ name, path }) => {
      return {
        name: name.replace(/.[t|j]s$/, ''),
        up: async () => {
          const { up } = await import(path as string);
          if (up) {
            const scope = app.serviceSpace.createScope();
            await scope.injectContainer(up);
          }
        },
        down: async () => {
          const { down } = await import(path as string);
          if (down) {
            const scope = app.serviceSpace.createScope();
            await scope.injectContainer(down);
          }
        },
      };
    },
  },
});

program
  .usage('[options]')
  .option('--down', 'roll back down')
  .parse(process.argv);
  
const options = program.opts();

async function migrate() {
  await app.start();

  if (options.down) {
    await umzug.down();
  } else {
    await umzug.up();
  }

  await app.stop();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
`;
