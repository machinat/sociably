import type { SociablyNode } from '@sociably/core';
import { makeUnitSegment } from '@sociably/core/renderer';
import type { UnitSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent';
import { PATH_MESSAGES } from '../constant';
import type { MessageValue, FacebookComponent } from '../types';

/**
 * @category Props
 */
export type MediaTemplateProps = {
  /** The type of media being sent */
  mediaType: 'image' | 'video';
  /** One optional button element to be appended to the template */
  buttons?: SociablyNode;
  /** The attachment ID of the image or video. Cannot be used if url is set. */
  attachmentId?: string;
  /** The URL of the image. Cannot be used if attachment_id is set. */
  url?: string;
  /**
   * Set to true to enable the native share button in Messenger for the template
   * message. Defaults to false.
   */
  sharable?: boolean;
};

/**
 * The media template allows you to send a structured message that includes an
 * image or video, and an optional button.
 * @category Component
 * @props {@link MediaTemplate}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/media)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/media).
 */
export const MediaTemplate: FacebookComponent<
  MediaTemplateProps,
  UnitSegment<MessageValue>
> = makeFacebookComponent(async function MediaTemplate(node, path, render) {
  const { buttons, mediaType, attachmentId, url, sharable } = node.props;
  const buttonSegments = await render(buttons, '.buttons');
  const buttonValues = buttonSegments?.map((segment) => segment.value);

  return [
    makeUnitSegment(node, path, {
      type: 'message',
      apiPath: PATH_MESSAGES,
      params: {
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'media',
              sharable,
              elements: [
                {
                  media_type: mediaType,
                  url,
                  attachment_id: attachmentId,
                  buttons: buttonValues,
                },
              ],
            },
          },
        },
      },
    }),
  ];
});
