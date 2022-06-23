import { when } from '../../utils';
import { CreateAppContext } from '../../types';

export default ({
  platforms,
  recognizer,
  withWebview,
}: CreateAppContext): string => `
import Sociably from '@sociably/core';
import Http from '@sociably/http';${when(platforms.includes('messenger'))`
import Messenger from '@sociably/messenger';${when(withWebview)`
import MessengerAuth from '@sociably/messenger/webview';`}`}${when(
  platforms.includes('twitter')
)`
import Twitter from '@sociably/twitter';
import TwitterAssetManager from '@sociably/twitter/asset';${when(withWebview)`
import TwitterAuth from '@sociably/twitter/webview';`}`}${when(
  platforms.includes('telegram')
)`
import Telegram from '@sociably/telegram';${when(withWebview)`
import TelegramAuth from '@sociably/telegram/webview';`}`}${when(
  platforms.includes('line')
)`
import Line from '@sociably/line';${when(withWebview)`
import LineAuth from '@sociably/line/webview';`}`}${when(withWebview)`
import Webview from '@sociably/webview';`}
import Script from '@sociably/script';
import RedisState from '@sociably/redis-state';
import {
  FileState,${when(recognizer === 'regex')`
  RegexRecognition,`}
} from '@sociably/dev-tools';${when(recognizer === 'dialogflow')`
import Dialogflow from '@sociably/dialogflow';`}${when(withWebview)`
import nextConfigs from '../webview/next.config.js';`}
import useIntent from './services/useIntent';
import useUserProfile from './services/useUserProfile';
import recognitionData from './recognitionData';
import * as scenes from './scenes';

const {
  // basic
  APP_NAME,
  NODE_ENV,
  PORT,${when(withWebview)`
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
  LINE_CHANNEL_SECRET,${when(withWebview)`
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
  return Sociably.createApp({
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
        channelSecret: LINE_CHANNEL_SECRET,${when(withWebview)`
        liffId: LINE_LIFF_ID,`}
      }),`}${when(withWebview)`

      Webview.initModule<${when(platforms.includes('messenger'))`
        | MessengerAuth`}${when(platforms.includes('twitter'))`
        | TwitterAuth`}${when(platforms.includes('telegram'))`
        | TelegramAuth`}${when(platforms.includes('line'))`
        | LineAuth`}
      >({
        webviewHost: DOMAIN,
        webviewPath: '/webview',
        authSecret: WEBVIEW_AUTH_SECRET,
        authPlatforms: [${when(platforms.includes('messenger'))`
          MessengerAuth,`}${when(platforms.includes('twitter'))`
          TwitterAuth,`}${when(platforms.includes('telegram'))`
          TelegramAuth,`}${when(platforms.includes('line'))`
          LineAuth,`}
        ],${when(platforms.includes('messenger'))`
        cookieSameSite: 'none',`}
        noNextServer: options?.noServer,
        nextServerOptions: {
          dev: DEV,
          dir: './webview',
          conf: nextConfigs,
        },
        basicAuth: {
          appName: APP_NAME,
          appIconUrl: 'https://machinat.github.io/sociably/img/logo.jpg',
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
