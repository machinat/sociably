// @flow
import type { AssetStore } from 'machinat-asset-store/types';
import type { DispatchResponse } from 'machinat-base/types';
import type {
  MessengerJob,
  MessengerAPIResult,
  MessengerBotPlugin,
  MessengerEventMiddleware,
  MessengerDispatchMiddleware,
} from '../types';
import type MessengerBot from '../bot';

import MessengerAssetManager from './manager';
import { ATTACHMENT } from './resourceType';

const messengerAssetPlugin = (store: AssetStore): MessengerBotPlugin => (
  bot: MessengerBot
) => {
  const manager = new MessengerAssetManager(store, bot);

  const eventMiddleware: MessengerEventMiddleware = next => frame =>
    next({
      ...frame,
      assets: manager,
    });

  const dispatchMiddleware: MessengerDispatchMiddleware = next => async frame => {
    const response: DispatchResponse<
      MessengerJob,
      MessengerAPIResult
    > = await next(frame);
    const { jobs, results } = response;

    const assetUpdatings = [];

    for (let i = 0; i < jobs.length; i += 1) {
      const { attachmentAssetTag } = jobs[i];
      const { body } = results[i];

      if (attachmentAssetTag && body.attachment_id) {
        assetUpdatings.push(
          manager.setAsset(ATTACHMENT, attachmentAssetTag, body.attachment_id)
        );
      }
    }

    await Promise.all(assetUpdatings);
    return response;
  };

  return { eventMiddleware, dispatchMiddleware };
};

export default messengerAssetPlugin;
