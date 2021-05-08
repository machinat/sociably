import { when, polishFileContent } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(when(platforms.includes('webview'))`
module.exports = {
  distDir: '../../dist',
  basePath: '/webview',
  publicRuntimeConfig: {},
};
`);
