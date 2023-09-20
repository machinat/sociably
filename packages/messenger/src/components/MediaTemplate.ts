import type {
  SociablyNode,
  NativeElement,
  AnyNativeComponent,
} from '@sociably/core';
import {
  makeUnitSegment,
  UnitSegment,
  InnerRenderFn,
} from '@sociably/core/renderer';
import { PATH_MESSAGES } from '../constant.js';
import type { MessageValue } from '../types.js';

/** @category Props */
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

export async function MediaTemplate(
  node: NativeElement<MediaTemplateProps, AnyNativeComponent>,
  path: string,
  render: InnerRenderFn,
): Promise<UnitSegment<MessageValue>[]> {
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
}
