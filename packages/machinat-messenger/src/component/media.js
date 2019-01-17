import { annotate, asNative, asUnit, hasEntry } from 'machinat-utility';

import {
  ATTACHED_FILE_DATA,
  ATTACHED_FILE_INFO,
  MESSENGER_NAITVE_TYPE,
} from '../symbol';
import { ENTRY_MESSAGES } from '../apiEntry';

const nativeMediaFactroy = (name, type) => {
  const container = {
    [name]: ({ url, reusable, attachmentId, data, fileInfo }) => [
      {
        message: {
          attachment: {
            type,
            payload: {
              url,
              is_reusable: reusable,
              attachment_id: attachmentId,
            },
          },
        },
        [ATTACHED_FILE_DATA]: data,
        [ATTACHED_FILE_INFO]: fileInfo,
      },
    ],
  };

  return annotate(
    asNative(MESSENGER_NAITVE_TYPE),
    hasEntry(ENTRY_MESSAGES),
    asUnit(true)
  )(container[name]);
};

export const Image = nativeMediaFactroy('Image', 'image');
export const Video = nativeMediaFactroy('Video', 'video');
export const Audio = nativeMediaFactroy('Audio', 'audio');
export const File = nativeMediaFactroy('File', 'file');
