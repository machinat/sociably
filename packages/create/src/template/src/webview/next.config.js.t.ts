import { when, polishFileContent } from '../../../templateHelper';
import { CreateAppContext } from '../../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(when(platforms.includes('webview'))`
module.exports = {
  distDir: '../../dist',
  basePath: '/webview',
  publicRuntimeConfig: {},
};
`);
