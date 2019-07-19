// @flow
import type { AssetStore } from 'machinat-asset-store/types';
import type { MessengerBotPlugin, MessengerEventMiddleware } from '../types';
import type MessengerBot from '../bot';

import MessengerAssetsAccessor from './accessor';

const messengerAssetsPlugin = (store: AssetStore): MessengerBotPlugin => (
  bot: MessengerBot
) => {
  const { pageId } = bot.options;
  const accessor = new MessengerAssetsAccessor(store, pageId);

  const eventMiddlware: MessengerEventMiddleware = next => {
    return frame => next({ ...frame, assets: accessor });
  };

  return { eventMiddlware };
};

export default messengerAssetsPlugin;
