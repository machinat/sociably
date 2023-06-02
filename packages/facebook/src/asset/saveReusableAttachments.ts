import { DispatchError } from '@sociably/core/engine';
import { serviceContainer } from '@sociably/core/service';
import { MetaApiJob, MetaApiResult } from '@sociably/meta-api';
import type { FacebookDispatchMiddleware } from '../types.js';
import FacebookPage from '../Page.js';
import AssetsManagerP from './AssetsManager.js';

const updateAssetsFromSuccessfulJobs = async (
  manager: AssetsManagerP,
  jobs: MetaApiJob[],
  results: (void | MetaApiResult)[]
) => {
  const updatingAssets: Promise<boolean>[] = [];

  for (let i = 0; i < jobs.length; i += 1) {
    const result = results[i];
    if (result) {
      const { channel, assetTag } = jobs[i];
      const { body } = result;

      if (assetTag && body.attachment_id) {
        updatingAssets.push(
          manager.saveAttachment(
            channel as FacebookPage,
            assetTag,
            body.attachment_id
          )
        );
      }
    }
  }
  await Promise.all(updatingAssets);
};

/**
 * saveReusableAttachments save the id of uploaded attachments with `assetTag`
 *  props. The attachment id can then be retrieved by the tag through
 * {@link FacebookAssetsManager.getAttachment}.
 */
const saveReusableAttachments =
  (manager: AssetsManagerP): FacebookDispatchMiddleware =>
  async (frame, next) => {
    try {
      const response = await next(frame);
      const { jobs, results } = response;

      await updateAssetsFromSuccessfulJobs(manager, jobs, results);
      return response;
    } catch (error) {
      if (error instanceof DispatchError) {
        const { jobs, results }: DispatchError<MetaApiJob, MetaApiResult> =
          error;
        await updateAssetsFromSuccessfulJobs(manager, jobs, results);
      }

      throw error;
    }
  };

export default serviceContainer({
  deps: [AssetsManagerP],
})(saveReusableAttachments);
