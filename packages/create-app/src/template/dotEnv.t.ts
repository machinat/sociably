import randomName from 'project-name-generator';
import { nanoid } from 'nanoid';
import { when } from '../utils.js';
import type { CreateAppContext } from '../types.js';

export const name = '.env';

export default ({
  projectName,
  platforms,
  recognizer,
  withWebview,
}: CreateAppContext): string => {
  const localTunnelSubDomain = randomName({ number: true }).dashed;
  return `
APP_NAME= "${projectName
    .split(/[-_\s]+/)
    .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
    .join(' ')}"
NODE_ENV=development
DEV_TUNNEL_SUBDOMAIN=${localTunnelSubDomain}
DOMAIN=${localTunnelSubDomain}.t.machinat.dev
PORT=8080
${when(platforms.includes('facebook'))`
# Facebook

FACEBOOK_PAGE_ID=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_ACCESS_TOKEN=
FACEBOOK_VERIFY_TOKEN=${nanoid(16)}
`}${when(platforms.includes('twitter'))`
# Twitter

TWITTER_APP_ID=
TWITTER_APP_KEY=
TWITTER_APP_SECRET=
TWITTER_BEARER_TOKEN=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=
TWITTER_WEBHOOK_ENV= default
`}${when(platforms.includes('telegram'))`
# Telegram

TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_NAME=
TELEGRAM_SECRET_PATH=${nanoid(32)}
`}${when(platforms.includes('line'))`
# Line

LINE_PROVIDER_ID=
LINE_CHANNEL_ID=
LINE_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=${when(withWebview)`
LINE_LIFF_ID=`}
`}${when(withWebview)`
# Webview

WEBVIEW_AUTH_SECRET=${nanoid(32)}
`}${when(recognizer === 'dialogflow')`
# Dialogflow

DIALOGFLOW_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=`}
`;
};
