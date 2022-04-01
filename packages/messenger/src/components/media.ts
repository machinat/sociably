import { makeUnitSegment } from '@machinat/core/renderer';
import type { UnitSegment } from '@machinat/core/renderer';
import { makeMessengerComponent } from '../utils';
import {
  ATTACHMENT_ASSET_TAG,
  ATTACHMENT_DATA,
  ATTACHMENT_INFO,
} from '../constant';
import type { MessageValue, MessengerComponent } from '../types';

/**
 * @category Props
 */
export type MediaProps = {
  /**
   * URL of the file to upload. Max file size is 25MB (after encoding). A
   * Timeout is set to 75 sec for videos and 10 secs for every other file type.
   */
  url: string;
  /**
   * Set to true to make the saved asset sendable to other message recipients.
   * Defaults to false.
   */
  reusable?: boolean;
  /**
   * Set to true to make the saved asset sendable to other message recipients.
   * Defaults to false.
   */
  attachmentId?: string;

  assetTag?: string;
  fileData?: string | Buffer | ReadableStream;
  fileInfo?: {
    filename?: string;
    filepath?: string;
    contentType?: string;
    knownLength?: number;
  };
};

const mediaFactory = (
  name: string,
  type: string
): MessengerComponent<MediaProps, UnitSegment<MessageValue>> => {
  const container = {
    [name]: (node, path) => {
      const { url, reusable, attachmentId, assetTag, fileData, fileInfo } =
        node.props;

      return [
        makeUnitSegment(node, path, {
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
          [ATTACHMENT_ASSET_TAG]: assetTag,
          [ATTACHMENT_DATA]: fileData,
          [ATTACHMENT_INFO]: fileInfo,
        }),
      ];
    },
  };

  return makeMessengerComponent(container[name]);
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
