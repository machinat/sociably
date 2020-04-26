// @flow
import { container } from '@machinat/core/service';
import type { ServiceContainer } from '@machinat/core/service/types';
import type { MessengerDispatchMiddleware } from '../types';
import MessengerAssetRegistry from './registry';

const collectSharableAttachments: ServiceContainer<MessengerDispatchMiddleware> = (
  registry: MessengerAssetRegistry
) => async (frame, next) => {
  const response = await next(frame);
  const { jobs, results } = response;

  const updatingAssets = [];

  for (let i = 0; i < jobs.length; i += 1) {
    const { attachmentAssetTag } = jobs[i];
    const { body } = results[i];

    if (attachmentAssetTag && body.attachment_id) {
      updatingAssets.push(
        registry.setAttachmentId(attachmentAssetTag, body.attachment_id)
      );
    }
  }

  await Promise.all(updatingAssets);
  return response;
};

export default container<MessengerDispatchMiddleware>({
  deps: [MessengerAssetRegistry],
})(collectSharableAttachments);
