import { when } from '../../utils';
import { CreateAppContext } from '../../types';

export default ({
  platforms,
  recognizer,
  projectName,
}: CreateAppContext): string => `
import Machinat from '@machinat/core';
import Http from '@machinat/http';${when(platforms.includes('messenger'))`
import Messenger from '@machinat/messenger';${when(
  platforms.includes('webview')
)`
import MessengerWebviewAuth from '@machinat/messenger/webview';`}`}${when(
  platforms.includes('line')
)`
import Line from '@machinat/line';${when(platforms.includes('webview'))`
import LineWebviewAuth from '@machinat/line/webview';`}`}${when(
  platforms.includes('twitter')
)`
import Twitter from '@machinat/twitter';
import TwitterAssetManager from '@machinat/twitter/asset';${when(
  platforms.includes('webview')
)`
import TwitterWebviewAuth from '@machinat/twitter/webview';`}`}${when(
  platforms.includes('telegram')
)`
import Telegram from '@machinat/telegram';${when(platforms.includes('webview'))`
import TelegramWebviewAuth from '@machinat/telegram/webview';`}`}${when(
  platforms.includes('webview')
)`
import Webview from '@machinat/webview';`}
import Script from '@machinat/script';
import RedisState from '@machinat/redis-state';
import {
  FileState,${when(recognizer === 'regex')`
  RegexRecognition,`}
} from '@machinat/dev-tools';${when(recognizer === 'dialogflow')`
import Dialogflow from '@machinat/dialogflow';`}${when(
  platforms.includes('webview')
)`
import nextConfigs from '../webview/next.config.js';`}
import useIntent from './services/useIntent';
import useUserProfile from './services/useUserProfile';
import recognitionData from './recognitionData';
import * as scenes from './scenes';

const {
  NODE_ENV,
  PORT,${when(platforms.includes('webview'))`
  DOMAIN,
  // webview
  WEBVIEW_AUTH_SECRET,`}${when(platforms.includes('messenger'))`
  // messenger
  MESSENGER_PAGE_ID,
  MESSENGER_ACCESS_TOKEN,
  MESSENGER_APP_SECRET,
  MESSENGER_VERIFY_TOKEN,`}${when(platforms.includes('twitter'))`
  // twitter
  TWITTER_APP_ID,
  TWITTER_APP_KEY,
  TWITTER_APP_SECRET,
  TWITTER_BEARER_TOKEN,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET,`}${when(platforms.includes('telegram'))`
  // telegram
  TELEGRAM_BOT_NAME,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_SECRET_PATH,`}${when(platforms.includes('line'))`
  // line
  LINE_PROVIDER_ID,
  LINE_CHANNEL_ID,
  LINE_ACCESS_TOKEN,
  LINE_CHANNEL_SECRET,${when(platforms.includes('webview'))`
  LINE_LIFF_ID,`}`}
  // redis
  REDIS_URL,${when(recognizer === 'dialogflow')`
  // dialogflow
  DIALOGFLOW_PROJECT_ID,`}
} = process.env as Record<string, string>;

const DEV = NODE_ENV === 'development';

type CreateAppOptions = {
  noServer?: boolean;
};

const createApp = (options?: CreateAppOptions) => {
  return Machinat.createApp({
    modules: [
      Http.initModule({
        noServer: options?.noServer,
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
${when(recognizer === 'dialogflow')`
      Dialogflow.initModule({
        recognitionData,
        projectId: DIALOGFLOW_PROJECT_ID,
      }),`}${when(recognizer === 'regex')`
      RegexRecognition.initModule({
        recognitionData,
      }),`}
      
      Script.initModule({
        libs: Object.values(scenes),
      }),
    ],

    platforms: [${when(platforms.includes('messenger'))`
      Messenger.initModule({
        webhookPath: '/webhook/messenger',
        pageId: MESSENGER_PAGE_ID,
        appSecret: MESSENGER_APP_SECRET,
        accessToken: MESSENGER_ACCESS_TOKEN,
        verifyToken: MESSENGER_VERIFY_TOKEN,
      }),`}${when(platforms.includes('twitter'))`

      Twitter.initModule({
        webhookPath: '/webhook/twitter',
        appId: TWITTER_APP_ID,
        appKey: TWITTER_APP_KEY,
        appSecret: TWITTER_APP_SECRET,
        bearerToken: TWITTER_BEARER_TOKEN,
        accessToken: TWITTER_ACCESS_TOKEN,
        accessSecret: TWITTER_ACCESS_SECRET,
      }),`}${when(platforms.includes('telegram'))`

      Telegram.initModule({
        webhookPath: '/webhook/telegram',
        botName: TELEGRAM_BOT_NAME,
        botToken: TELEGRAM_BOT_TOKEN,
        secretPath: TELEGRAM_SECRET_PATH,
      }),`}${when(platforms.includes('line'))`

      Line.initModule({
        webhookPath: '/webhook/line',
        providerId: LINE_PROVIDER_ID,
        channelId: LINE_CHANNEL_ID,
        accessToken: LINE_ACCESS_TOKEN,
        channelSecret: LINE_CHANNEL_SECRET,${when(
          platforms.includes('webview')
        )`
        liffId: LINE_LIFF_ID,`}
      }),`}${when(platforms.includes('webview'))`

      Webview.initModule<${when(platforms.includes('messenger'))`
        | MessengerWebviewAuth`}${when(platforms.includes('telegram'))`
        | TelegramWebviewAuth`}${when(platforms.includes('line'))`
        | LineWebviewAuth`}
      >({
        webviewHost: DOMAIN,
        webviewPath: '/webview',
        authSecret: WEBVIEW_AUTH_SECRET,
        authPlatforms: [${when(platforms.includes('messenger'))`
          MessengerWebviewAuth,`}${when(platforms.includes('twitter'))`
          TwitterWebviewAuth,`}${when(platforms.includes('telegram'))`
          TelegramWebviewAuth,`}${when(platforms.includes('line'))`
          LineWebviewAuth,`}
        ],${when(platforms.includes('messenger'))`
        cookieSameSite: 'none',`}
        noNextServer: options?.noServer,
        nextServerOptions: {
          dev: DEV,
          dir: './webview',
          conf: nextConfigs,
        },
        basicAuth: {
          appName: '${projectName
            .split(/[-_\s]+/)
            .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
            .join(' ')}',
          appImageUrl: 'https://machinat.com/img/logo.jpg',
        },
      }),`}
    ],

    services: [
      useIntent,
      useUserProfile,${when(platforms.includes('twitter'))`
      TwitterAssetManager,`}
    ],
  });
};

export default createApp;
`;
