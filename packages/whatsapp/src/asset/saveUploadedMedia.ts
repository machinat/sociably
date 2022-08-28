import { makeContainer } from '@sociably/core/service';
import type { WhatsAppDispatchMiddleware } from '../types';
import AssetsManagerP from './AssetsManager';

/**
 * saveUploadedMedia save the id of uploaded attachments with `assetTag`
 *  props. The attachment id can then be retrieved by the tag through
 * {@link WhatsAppAssetsManager.getMedia}.
 */
const saveUploadedMedia =
  (manager: AssetsManagerP): WhatsAppDispatchMiddleware =>
  async (frame, next) => {
    const response = await next(frame);
    const { jobs, results } = response;

    const updatingAssets: Promise<boolean>[] = [];

    for (let i = 0; i < jobs.length; i += 1) {
      const { assetTag } = jobs[i];
      const { body } = results[i];

      if (assetTag && body.id) {
        updatingAssets.push(manager.saveMedia(assetTag, body.id));
      }
    }

    await Promise.all(updatingAssets);
    return response;
  };

export default makeContainer({
  deps: [AssetsManagerP],
})(saveUploadedMedia);
