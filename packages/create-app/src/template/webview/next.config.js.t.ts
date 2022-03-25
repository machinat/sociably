import { when } from '../../utils';
import { CreateAppContext } from '../../types';

export default ({ platforms }: CreateAppContext): string => when(
  platforms.includes('webview')
)`
module.exports = {
  distDir: '../dist',
  basePath: '/webview',
  publicRuntimeConfig: {${when(platforms.includes('messenger'))`
    messengerAppId: process.env.MESSENGER_APP_ID,`}${when(
  platforms.includes('telegram')
)`
    telegramBotName: process.env.TELEGRAM_BOT_NAME,`}${when(
  platforms.includes('line')
)`
    lineLiffId: process.env.LINE_LIFF_ID,`}
  }
};
`;
