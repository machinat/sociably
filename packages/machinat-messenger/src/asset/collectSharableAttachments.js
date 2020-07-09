// @flow
import { container } from '@machinat/core/service';
import type { ServiceContainer } from '@machinat/core/service/types';
import type { MessengerDispatchMiddleware } from '../types';
import MessengerAssetManager from './manager';

const collectSharableAttachments: ServiceContainer<MessengerDispatchMiddleware> = (
  manager: MessengerAssetManager
) => async (frame, next) => {
  const response = await next(frame);
  const { jobs, results } = response;

  const updatingAssets = [];

  for (let i = 0; i < jobs.length; i += 1) {
    const { attachmentAssetTag } = jobs[i];
    const { body } = results[i];

    if (attachmentAssetTag && body.attachment_id) {
      updatingAssets.push(
        manager.setAttachmentId(attachmentAssetTag, body.attachment_id)
      );
    }
  }

  await Promise.all(updatingAssets);
  return response;
};

export default container<MessengerDispatchMiddleware>({
  deps: [MessengerAssetManager],
})(collectSharableAttachments);
