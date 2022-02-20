import { makeContainer } from '@machinat/core/service';
import type { TwitterDispatchMiddleware } from '../types';
import AssetsManagerP from './AssetsManager';

/**
 * saveUplodedFile save the id of uploaded files with the `fileAssetTag` prop
 * annotated. The file id can then be retrieved using the tag through
 * {@link TwitterAssetsManager.getFileId}.
 * @category Container
 */
const saveUplodedFile =
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

const saveUplodedFileC = makeContainer({
  deps: [AssetsManagerP],
})(saveUplodedFile);

export default saveUplodedFileC;
