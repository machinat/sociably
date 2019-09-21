// @flow
import type { AssetsStore } from 'machinat-assets-store/types';
import type { DispatchResponse } from 'machinat-base/types';
import type {
  MessengerJob,
  MessengerAPIResult,
  MessengerBotPlugin,
  MessengerEventMiddleware,
  MessengerDispatchMiddleware,
} from '../types';
import type MessengerBot from '../bot';

import MessengerAssetRepository from './repository';
import { ATTACHMENT } from './resourceType';

const messengerAssetsPlugin = (store: AssetsStore): MessengerBotPlugin => (
  bot: MessengerBot
) => {
  const repository = new MessengerAssetRepository(store, bot);

  const eventMiddleware: MessengerEventMiddleware = next => frame =>
    next({
      ...frame,
      assets: repository,
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
          repository.setAsset(
            ATTACHMENT,
            attachmentAssetTag,
            body.attachment_id
          )
        );
      }
    }

    await Promise.all(assetUpdatings);
    return response;
  };

  return { eventMiddleware, dispatchMiddleware };
};

export default messengerAssetsPlugin;
