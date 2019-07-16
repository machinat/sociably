// @flow
import type { AssetStore } from 'machinat-asset-store/types';
import type { LineBotPlugin } from '../types';
import type LineBot from '../bot';
import LineAssetsAccessor from './accessor';

const lineAssetsPlugin = (store: AssetStore): LineBotPlugin => (
  bot: LineBot
) => {
  const manager = new LineAssetsAccessor(store, bot.options.channelId);

  return {
    eventMiddlware(next) {
      return frame => next({ ...frame, assets: manager });
    },
  };
};

export default lineAssetsPlugin;
