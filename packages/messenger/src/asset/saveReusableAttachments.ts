import { makeContainer } from '@machinat/core/service';
import type { MessengerDispatchMiddleware } from '../types';
import AssetsManagerP from './AssetsManager';

/**
 * collectReusableAttachments collect attachmentId of reusable from response
 * and store it MessengerAssetsManager.
 * @category Container
 */
const collectReusableAttachments =
  (manager: AssetsManagerP): MessengerDispatchMiddleware =>
  async (frame, next) => {
    const response = await next(frame);
    const { jobs, results } = response;

    const updatingAssets: Promise<boolean>[] = [];

    for (let i = 0; i < jobs.length; i += 1) {
      const { attachmentAssetTag } = jobs[i];
      const { body } = results[i];

      if (attachmentAssetTag && body.attachment_id) {
        updatingAssets.push(
          manager.saveAttachment(attachmentAssetTag, body.attachment_id)
        );
      }
    }

    await Promise.all(updatingAssets);
    return response;
  };

const collectReusableAttachmentsC = makeContainer({
  deps: [AssetsManagerP] as const,
})(collectReusableAttachments);

export default collectReusableAttachmentsC;
