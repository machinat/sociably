import { serviceContainer } from '@sociably/core/service';
import { DispatchError } from '@sociably/core/engine';
import type {
  TwitterDispatchMiddleware,
  TwitterJob,
  TwitterApiResult,
} from '../types.js';
import AssetsManagerP from './AssetsManager.js';

const updateAssetsFromSuccessfulJobs = async (
  manager: AssetsManagerP,
  jobs: TwitterJob[],
  results: (void | TwitterApiResult)[]
) => {
  const updatingPromises: Promise<boolean>[] = [];

  for (let i = 0; i < results.length; i += 1) {
    const { target } = jobs[i];
    const result = results[i];

    if (result && target) {
      const { uploadedMedia } = result;

      if (uploadedMedia) {
        for (const { assetTag, result: mediaResult } of uploadedMedia) {
          if (assetTag) {
            updatingPromises.push(
              manager.saveMedia(
                target.agent,
                assetTag,
                mediaResult.media_id_string
              )
            );
          }
        }
      }
    }
  }

  await Promise.all(updatingPromises);
};

/**
 * saveUplodedMedia save the id of uploaded media with the `assetTag` prop.
 * The media id can then be retrieved by the tag through
 * {@link TwitterAssetsManager.getMedia}.
 */
const saveUplodedMedia =
  (manager: AssetsManagerP): TwitterDispatchMiddleware =>
  async (frame, next) => {
    try {
      const response = await next(frame);
      const { jobs, results } = response;

      await updateAssetsFromSuccessfulJobs(manager, jobs, results);
      return response;
    } catch (error) {
      if (error instanceof DispatchError) {
        const { jobs, results }: DispatchError<TwitterJob, TwitterApiResult> =
          error;
        await updateAssetsFromSuccessfulJobs(manager, jobs, results);
      }
      throw error;
    }
  };

export default serviceContainer({
  deps: [AssetsManagerP],
})(saveUplodedMedia);
