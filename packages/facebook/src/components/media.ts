import { makeUnitSegment } from '@sociably/core/renderer';
import type { UnitSegment } from '@sociably/core/renderer';
import type { FileInfo } from '@sociably/meta-api';
import makeFacebookComponent from '../utils/makeFacebookComponent';
import { PATH_MESSAGES } from '../constant';
import type { MessageValue, FacebookComponent } from '../types';

/**
 * @category Props
 */
export type MediaProps = {
  /**
   * URL of the file to upload. Max file size is 25MB (after encoding). A
   * Timeout is set to 75 sec for videos and 10 secs for every other file type.
   */
  url?: string;
  /**
   * Set to true to make the saved asset sendable to other message recipients.
   * Defaults to false.
   */
  reusable?: boolean;
  /** Use an uploaded attachment id */
  attachmentId?: string;
  /** The asset tag for saving the created attachment and reusing it */
  assetTag?: string;
  /** Upload a media file */
  fileData?: string | Buffer | NodeJS.ReadableStream;
  /** Uploading info */
  fileInfo?: FileInfo;
};

const mediaFactory = (
  name: string,
  type: string
): FacebookComponent<MediaProps, UnitSegment<MessageValue>> => {
  const container = {
    [name]: (node, path) => {
      const { url, reusable, attachmentId, assetTag, fileData, fileInfo } =
        node.props;

      return [
        makeUnitSegment(node, path, {
          type: 'message' as const,
          apiPath: PATH_MESSAGES,
          params: {
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
          },
          attachFile: fileData
            ? {
                data: fileData,
                info: fileInfo,
                assetTag,
              }
            : undefined,
        }),
      ];
    },
  };

  return makeFacebookComponent(container[name]);
};

/**
 * The log out button triggers the account unlinking flow.
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const Image = mediaFactory('Image', 'image');

/**
 * The log out button triggers the account unlinking flow.
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const Video = mediaFactory('Video', 'video');

/**
 * The log out button triggers the account unlinking flow.
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const Audio = mediaFactory('Audio', 'audio');

/**
 * The log out button triggers the account unlinking flow.
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const File = mediaFactory('File', 'file');
