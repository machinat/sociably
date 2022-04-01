import { makeContainer } from '@machinat/core/service';
import type { TwitterDispatchMiddleware } from '../types';
import AssetsManagerP from './AssetsManager';

/**
 * saveUplodedMedia save the id of uploaded media with the `assetTag` prop.
 * The media id can then be retrieved by the tag through
 * {@link TwitterAssetsManager.getMedia}.
 */
const saveUplodedMedia =
  (manager: AssetsManagerP): TwitterDispatchMiddleware =>
  async (frame, next) => {
    const response = await next(frame);
    const { jobs, results } = response;

    const updatingPromises: Promise<boolean>[] = [];

    for (let i = 0; i < jobs.length; i += 1) {
      const { uploadedMedia } = results[i];

      if (uploadedMedia) {
        for (const { assetTag, result } of uploadedMedia) {
          if (assetTag) {
            updatingPromises.push(
              manager.saveMedia(assetTag, result.media_id_string)
            );
          }
        }
      }
    }

    await Promise.all(updatingPromises);
    return response;
  };

export default makeContainer({
  deps: [AssetsManagerP],
})(saveUplodedMedia);
