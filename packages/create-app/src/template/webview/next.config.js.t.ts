import { when } from '../../utils';
import { CreateAppContext } from '../../types';

export default ({ platforms, withWebview }: CreateAppContext): string => when(
  withWebview
)`
const {${when(platforms.includes('messenger'))`
  MESSENGER_PAGE_ID,`}${when(platforms.includes('twitter'))`
  TWITTER_ACCESS_TOKEN,`}${when(platforms.includes('telegram'))`
  TELEGRAM_BOT_NAME,`}${when(platforms.includes('line'))`
  LINE_LIFF_ID,`}
} = process.env;

module.exports = {
  distDir: '../dist',
  basePath: '/webview',
  publicRuntimeConfig: {${when(platforms.includes('messenger'))`
    messengerPageId: MESSENGER_PAGE_ID,`}${when(platforms.includes('twitter'))`
    twitterAgentId: TWITTER_ACCESS_TOKEN.split('-', 1)[0],`}${when(
  platforms.includes('telegram')
)`
    telegramBotName: TELEGRAM_BOT_NAME,`}${when(platforms.includes('line'))`
    lineLiffId: LINE_LIFF_ID,`}
  }
};
`;
