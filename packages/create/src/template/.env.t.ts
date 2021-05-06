import randomName from 'project-name-generator';
import { nanoid } from 'nanoid';
import { when, polishFileContent } from '../templateHelper';
import type { CreateAppContext } from '../types';

export default ({ platforms }: CreateAppContext) => {
  const localTunnelSubDomain = randomName({ number: true }).dashed;
  return polishFileContent(`
NODE_ENV=development

DEV_TUNNEL_SUBDOMAIN=${localTunnelSubDomain}
DOMAIN=${localTunnelSubDomain}.t.machinat.dev
PORT=8080

${when(platforms.includes('messenger'))`
# Messenger

MESSENGER_PAGE_ID=
MESSENGER_APP_ID=
MESSENGER_APP_SECRET=
MESSENGER_ACCESS_TOKEN=
MESSENGER_VERIFY_TOKEN=${nanoid(16)}
`}${when(platforms.includes('telegram'))`
# Telegram

TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_NAME=
TELEGRAM_SECRET_PATH=${nanoid(32)}
`}${when(platforms.includes('line'))`
# Line

LINE_PROVIDER_ID=
LINE_BOT_CHANNEL_ID=
LINE_OFFICIAL_ACCOUNT_ID=
LINE_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=${when(platforms.includes('webview'))`
LINE_LIFF_ID=`}`}
${when(platforms.includes('webview'))`
# Webview

WEBVIEW_AUTH_SECRET=${nanoid(32)}`}
`);
};
