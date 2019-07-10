/* eslint-disable no-empty-function */
import moxy from 'moxy';

const nextApp = moxy({
  async prepare() {},
  getRequestHandler: () => moxy(async () => {}),
  async render() {},
  async renderError() {},
  setAssetPrefix() {},
  renderOpts: { assetPrefix: '' },
});

export default nextApp;
