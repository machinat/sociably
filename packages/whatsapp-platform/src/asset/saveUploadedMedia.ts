import { serviceContainer } from '@sociably/core/service';
import { DispatchError } from '@sociably/core/engine';
import { MetaApiJob, MetaApiResult } from '@sociably/meta-api';
import type { WhatsAppDispatchMiddleware } from '../types.js';
import AssetsManagerP from './AssetsManager.js';
import WhatsAppAgent from '../Agent.js';

const updateAssetsFromSuccessfulJobs = async (
  manager: AssetsManagerP,
  jobs: MetaApiJob[],
  results: (void | MetaApiResult)[],
) => {
  const updatingAssets: Promise<boolean>[] = [];

  for (let i = 0; i < jobs.length; i += 1) {
    const result = results[i];
    if (result) {
      const { channel, assetTag } = jobs[i];
      const { body } = result;

      if (assetTag && body.id) {
        updatingAssets.push(
          manager.saveMedia(channel as WhatsAppAgent, assetTag, body.id),
        );
      }
    }
  }

  await Promise.all(updatingAssets);
};

/**
 * SaveUploadedMedia save the id of uploaded attachments with `assetTag` props.
 * The attachment id can then be retrieved by the tag through
 * {@link WhatsAppAssetsManager.getMedia}.
 */
const saveUploadedMedia =
  (manager: AssetsManagerP): WhatsAppDispatchMiddleware =>
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
})(saveUploadedMedia);
