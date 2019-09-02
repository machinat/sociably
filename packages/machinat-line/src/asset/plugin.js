// @flow
import type { AssetsStore } from 'machinat-asset-store/types';
import type { LineBotPlugin } from '../types';
import type LineBot from '../bot';
import LineAssetRepository from './repository';

const lineAssetsPlugin = (store: AssetsStore): LineBotPlugin => (
  bot: LineBot
) => {
  const manager = new LineAssetRepository(store, bot);

  return {
    eventMiddleware(next) {
      return frame => next({ ...frame, assets: manager });
    },
  };
};

export default lineAssetsPlugin;
