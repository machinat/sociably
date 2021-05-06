import { CreateAppContext } from '../../../types';
import { when, polishFileContent } from '../../../templateHelper';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(`
import { config as configEnv } from 'dotenv';
import { resolve as resolvePath } from 'path';
import Machinat from '@machinat/core';${when(platforms.includes('messenger'))`
import Messenger from '@machinat/messenger';`}${when(
    platforms.includes('telegram')
  )`
import Telegram from '@machinat/telegram';`}${when(platforms.includes('line'))`
import Line from '@machinat/line';`}
import { Umzug, JSONStorage } from 'umzug';
import commander from 'commander';

configEnv();
const {${when(platforms.includes('messenger'))`
  MESSENGER_PAGE_ID,
  MESSENGER_ACCESS_TOKEN,`}${when(platforms.includes('telegram'))`
  TELEGRAM_BOT_TOKEN,`}${when(platforms.includes('line'))`
  LINE_PROVIDER_ID,
  LINE_BOT_CHANNEL_ID,
  LINE_ACCESS_TOKEN,`}
} = process.env as Record<string, string>;

const app = Machinat.createApp({
  platforms: [
${when(platforms.includes('messenger'))`
    Messenger.initModule({
      pageId: Number(MESSENGER_PAGE_ID),
      accessToken: MESSENGER_ACCESS_TOKEN,
      noServer: true,
    }),`}
${when(platforms.includes('telegram'))`
    Telegram.initModule({
      botToken: TELEGRAM_BOT_TOKEN,
      noServer: true,
    }),`}
${when(platforms.includes('line'))`
    Line.initModule({
      providerId: LINE_PROVIDER_ID,
      channelId: LINE_BOT_CHANNEL_ID,
      accessToken: LINE_ACCESS_TOKEN,
      noServer: true,
    }),`}
  ],
});

const umzug = new Umzug({
  storage: new JSONStorage({
    path: resolvePath('./.executed_migrations.json'),
  }),
  logger: console,
  context: app,
  migrations: {
    glob: resolvePath(__dirname, '../migrations/*.+(js|ts)'),
    resolve: ({ name, path, context: app }) => {
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

commander
  .usage('[options]')
  .option('--down', 'roll back down')
  .parse(process.argv);
  
const options = commander.opts();

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
`);
