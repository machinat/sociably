// @flow
import type { AssetsStore } from 'machinat-asset-store/types';
import type { LineBotPlugin } from '../types';
import type LineBot from '../bot';
import LineAssetManager from './manager';

const lineAssetsPlugin = (store: AssetsStore): LineBotPlugin => (
  bot: LineBot
) => {
  const manager = new LineAssetManager(store, bot);

  return {
    eventMiddleware(next) {
      return frame => next({ ...frame, assets: manager });
    },
  };
};

export default lineAssetsPlugin;
