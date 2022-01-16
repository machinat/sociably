import { when, polishFileContent } from '../../utils';
import { CreateAppContext } from '../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(`
import Machinat from '@machinat/core';
import Http from '@machinat/http';${when(platforms.includes('messenger'))`
import Messenger from '@machinat/messenger';${when(
    platforms.includes('webview')
  )`
import MessengerAuthenticator from '@machinat/messenger/webview';`}`}${when(
    platforms.includes('line')
  )`
import Line from '@machinat/line';${when(platforms.includes('webview'))`
import LineAuthenticator from '@machinat/line/webview';`}`}${when(
    platforms.includes('telegram')
  )`
import Telegram from '@machinat/telegram';${when(platforms.includes('webview'))`
import TelegramAuthenticator from '@machinat/telegram/webview';`}`}${when(
    platforms.includes('webview')
  )`
import Webview from '@machinat/webview';`}
import RedisState from '@machinat/redis-state';
import { FileState } from '@machinat/dev-state';${when(
    platforms.includes('webview')
  )`
import {
  ServerDomain,${when(platforms.includes('line'))`
  LineLiffId,`}
} from './interface';
import nextConfigs from '../webview/next.config.js';`}

const {
  // location
  NODE_ENV,
  PORT,${when(platforms.includes('webview'))`
  DOMAIN,
  // webview
  WEBVIEW_AUTH_SECRET,`}${when(platforms.includes('messenger'))`
  // messenger
  MESSENGER_PAGE_ID,${when(platforms.includes('webview'))`
  MESSENGER_APP_ID,`}
  MESSENGER_ACCESS_TOKEN,
  MESSENGER_APP_SECRET,
  MESSENGER_VERIFY_TOKEN,`}${when(platforms.includes('telegram'))`
  // telegram
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_SECRET_PATH,`}${when(platforms.includes('line'))`
  // line
  LINE_PROVIDER_ID,
  LINE_CHANNEL_ID,
  LINE_ACCESS_TOKEN,
  LINE_CHANNEL_SECRET,
  LINE_LIFF_ID,`}
  // redis
  REDIS_URL,
} = process.env as Record<string, string>;

const DEV = NODE_ENV === 'development';

const app = Machinat.createApp({
  modules: [
    Http.initModule({
      listenOptions: {
        port: PORT ? Number(PORT) : 8080,
      },
    }),

    DEV
      ? FileState.initModule({
          path: './.state_data.json',
        })
      : RedisState.initModule({
          clientOptions: {
            url: REDIS_URL,
          },
        }),
  ],

  platforms: [${when(platforms.includes('messenger'))`

    Messenger.initModule({
      webhookPath: '/webhook/messenger',
      pageId: Number(MESSENGER_PAGE_ID),
      appSecret: MESSENGER_APP_SECRET,
      accessToken: MESSENGER_ACCESS_TOKEN,
      verifyToken: MESSENGER_VERIFY_TOKEN,
    }),`}${when(platforms.includes('telegram'))`

    Telegram.initModule({
      webhookPath: '/webhook/telegram',
      botToken: TELEGRAM_BOT_TOKEN,
      secretPath: TELEGRAM_SECRET_PATH,
    }),`}${when(platforms.includes('line'))`

    Line.initModule({
      webhookPath: '/webhook/line',
      providerId: LINE_PROVIDER_ID,
      channelId: LINE_CHANNEL_ID,
      accessToken: LINE_ACCESS_TOKEN,
      channelSecret: LINE_CHANNEL_SECRET,${when(platforms.includes('webview'))`
      liffChannelIds: [LINE_LIFF_ID.split('-')[0]],`}
    }),`}${when(platforms.includes('webview'))`

    Webview.initModule<${when(platforms.includes('messenger'))`
      | MessengerAuthenticator`}${when(platforms.includes('telegram'))`
      | TelegramAuthenticator`}${when(platforms.includes('line'))`
      | LineAuthenticator`}
    >({
      webviewHost: DOMAIN,
      webviewPath: '/webview',
      authSecret: WEBVIEW_AUTH_SECRET,
      ${when(platforms.includes('messenger'))`
      sameSite: 'none',`}
      nextServerOptions: {
        dev: DEV,
        dir: './webview',
        conf: nextConfigs,
      },
    }),`}
  ],
${when(platforms.includes('webview'))`
  services: [${when(platforms.includes('messenger'))`
    { provide: Webview.AuthenticatorList, withProvider: MessengerAuthenticator },`}${when(
  platforms.includes('telegram')
)`
    { provide: Webview.AuthenticatorList, withProvider: TelegramAuthenticator },`}${when(
  platforms.includes('line')
)`
    { provide: Webview.AuthenticatorList, withProvider: LineAuthenticator },`}
    
    { provide: ServerDomain, withValue: DOMAIN },${when(
      platforms.includes('line')
    )`
    { provide: LineLiffId, withValue: LINE_LIFF_ID },`}
  ],`}
});

export default app;
`);
