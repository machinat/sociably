import { when } from '../../utils.js';
import { CreateAppContext } from '../../types.js';

export default ({ platforms, withWebview }: CreateAppContext): string => when(
  withWebview,
)`
const {${when(platforms.includes('telegram'))`
  TELEGRAM_BOT_TOKEN,`}${when(platforms.includes('line'))`
  LINE_LIFF_ID,`}
} = process.env;

export default {
  distDir: '../dist',
  basePath: '/webview',
  publicRuntimeConfig: {${when(platforms.includes('telegram'))`
    TELEGRAM_BOT_ID: Number(TELEGRAM_BOT_TOKEN.split(':')[0]),`}${when(
    platforms.includes('line'),
  )`
    LINE_LIFF_ID,`}
  }
};
`;
