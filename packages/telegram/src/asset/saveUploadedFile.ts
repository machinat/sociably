import { makeContainer } from '@sociably/core/service';
import { DispatchError } from '@sociably/core/engine';
import TelegramUser from '../User';
import type {
  TelegramDispatchMiddleware,
  TelegramJob,
  TelegramResult,
} from '../types';
import AssetsManagerP from './AssetsManager';

const SINGLE_MEDIA_MESSAGE_METHODS_PATTERN =
  /^send(Audio|Document|Animation|Video|VideoNote|Voice|Sticker)$/;

const getLargestFileIdOfPhotoMessage = (message) => {
  const photos = message.photo;
  return photos[photos.length - 1].file_id;
};

const updateAssetsFromSuccessfulJobs = async (
  manager: AssetsManagerP,
  jobs: TelegramJob[],
  results: (void | TelegramResult)[]
) => {
  const updatingAssets: Promise<boolean>[] = [];

  for (let i = 0; i < jobs.length; i += 1) {
    const resultBody = results[i];
    if (resultBody) {
      const { botId, method, params, uploadFiles } = jobs[i];
      const { result } = resultBody;

      if (uploadFiles) {
        for (const { fieldName, assetTag } of uploadFiles) {
          if (assetTag) {
            let fileId: string | undefined;

            if (method === 'sendPhoto') {
              fileId = getLargestFileIdOfPhotoMessage(result);
            } else if (SINGLE_MEDIA_MESSAGE_METHODS_PATTERN.test(method)) {
              fileId = result[fieldName].file_id;
            } else if (method === 'editMessageMedia') {
              const mediaType = params.media.type;
              fileId =
                mediaType === 'photo'
                  ? getLargestFileIdOfPhotoMessage(result)
                  : result[mediaType].file_id;
            } else if (method === 'sendMediaGroup') {
              const fileRef = `attach://${fieldName}`;

              const inputIdx = params.media.findIndex(
                (input) => input.media === fileRef
              );

              if (inputIdx !== -1) {
                const input = params.media[inputIdx];
                fileId =
                  input.type === 'photo'
                    ? getLargestFileIdOfPhotoMessage(result[inputIdx])
                    : input.type === 'video'
                    ? result[inputIdx].video.file_id
                    : undefined;
              }
            }

            if (fileId) {
              const bot = new TelegramUser(botId, true);
              updatingAssets.push(manager.saveFile(bot, assetTag, fileId));
            }
          }
        }
      }
    }
  }
  await Promise.all(updatingAssets);
};

/**
 * saveUplodedFile save the id of uploaded files with the `assetTag` prop.
 * The file id can then be retrieved by the tag through
 * {@link TelegramAssetsManager.getFile}.
 */
const saveUplodedFile =
  (manager: AssetsManagerP): TelegramDispatchMiddleware =>
  async (frame, next) => {
    try {
      const response = await next(frame);
      const { jobs, results } = response;

      await updateAssetsFromSuccessfulJobs(manager, jobs, results);
      return response;
    } catch (error) {
      if (error instanceof DispatchError) {
        const { jobs, results }: DispatchError<TelegramJob, TelegramResult> =
          error;
        await updateAssetsFromSuccessfulJobs(manager, jobs, results);
      }

      throw error;
    }
  };

const saveUplodedFileC = makeContainer({
  deps: [AssetsManagerP],
})(saveUplodedFile);

export default saveUplodedFileC;
