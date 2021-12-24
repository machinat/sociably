import { when, polishFileContent } from '../../utils';
import { CreateAppContext } from '../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(when(platforms.includes('webview'))`
module.exports = {
  distDir: '../dist',
  basePath: '/webview',
  publicRuntimeConfig: {${when(platforms.includes('messenger'))`
    messengerAppId: MESSENGER_APP_ID,`}${when(platforms.includes('line'))`
    lineLiffId: LINE_LIFF_ID,`}
  }
};
`);
