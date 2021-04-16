import { makeContainer } from '@machinat/core/service';
import type { TelegramDispatchMiddleware } from '../types';
import AssetsManagerP from './manager';

const SINGLE_MEDIA_MESSAGE_METHODS_PATTERN = /^send(Audio|Document|Animation|Video|VideoNote|Voice|Sticker)$/;

const getLargestFileIdOfPhotoMessage = (message) => {
  const photos = message.photo;
  return photos[photos.length - 1].file_id;
};

/**
 * saveUplodedFile save the id of uploaded files with the `fileAssetTag` prop
 * annotated. The file id can then be retrieved using the tag through
 * {@link TelegramAssetsManager.getFileId}.
 * @category Container
 */
const saveUplodedFile = (
  manager: AssetsManagerP
): TelegramDispatchMiddleware => async (frame, next) => {
  const response = await next(frame);
  const { jobs, results } = response;

  const updatingAssets: Promise<void>[] = [];

  for (let i = 0; i < jobs.length; i += 1) {
    const { method, parameters, uploadingFiles } = jobs[i];
    const { result } = results[i];

    if (uploadingFiles) {
      for (const { fieldName, fileAssetTag } of uploadingFiles) {
        if (fileAssetTag) {
          let fileId: string | undefined;

          if (method === 'sendPhoto') {
            fileId = getLargestFileIdOfPhotoMessage(result);
          } else if (SINGLE_MEDIA_MESSAGE_METHODS_PATTERN.test(method)) {
            fileId = result[fieldName].file_id;
          } else if (method === 'editMessageMedia') {
            const mediaType = parameters.media.type;
            fileId =
              mediaType === 'photo'
                ? getLargestFileIdOfPhotoMessage(result)
                : result[mediaType].file_id;
          } else if (method === 'sendMediaGroup') {
            const fileRef = `attach://${fieldName}`;

            const inputIdx = parameters.media.findIndex(
              (input) => input.media === fileRef
            );

            if (inputIdx !== -1) {
              const input = parameters.media[inputIdx];
              fileId =
                input.type === 'photo'
                  ? getLargestFileIdOfPhotoMessage(result[inputIdx])
                  : input.type === 'video'
                  ? result[inputIdx].video.file_id
                  : undefined;
            }
          }

          if (fileId) {
            updatingAssets.push(manager.saveFile(fileAssetTag, fileId));
          }
        }
      }
    }
  }

  await Promise.all(updatingAssets);
  return response;
};

const saveUplodedFileC = makeContainer({
  deps: [AssetsManagerP] as const,
})(saveUplodedFile);

export default saveUplodedFileC;
