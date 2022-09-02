import { makeContainer } from '@sociably/core/service';
import type { FacebookDispatchMiddleware } from '../types';
import AssetsManagerP from './AssetsManager';

/**
 * saveReusableAttachments save the id of uploaded attachments with `assetTag`
 *  props. The attachment id can then be retrieved by the tag through
 * {@link FacebookAssetsManager.getAttachment}.
 */
const saveReusableAttachments =
  (manager: AssetsManagerP): FacebookDispatchMiddleware =>
  async (frame, next) => {
    const response = await next(frame);
    const { jobs, results } = response;

    const updatingAssets: Promise<boolean>[] = [];

    for (let i = 0; i < jobs.length; i += 1) {
      const { assetTag } = jobs[i];
      const { body } = results[i];

      if (assetTag && body.attachment_id) {
        updatingAssets.push(
          manager.saveAttachment(assetTag, body.attachment_id)
        );
      }
    }

    await Promise.all(updatingAssets);
    return response;
  };

export default makeContainer({
  deps: [AssetsManagerP],
})(saveReusableAttachments);
