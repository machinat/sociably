// @flow
import type { AssetStore } from 'machinat-asset-store/types';
import type { LineBotPlugin } from '../types';
import type LineBot from '../bot';
import LineAssetsAccessor from './accessor';

const lineAssetsPlugin = (store: AssetStore): LineBotPlugin => (
  bot: LineBot
) => {
  const accessor = new LineAssetsAccessor(store, bot);

  return {
    eventMiddleware(next) {
      return frame => next({ ...frame, assets: accessor });
    },
  };
};

export default lineAssetsPlugin;
