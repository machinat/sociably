import { SociablyNode } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppComponent, WhatsAppSegmentValue } from '../types.js';

/** @category Props */
export type TextProps = {
  /**
   * The textual content which can contain URLs (http:// or https://) and text
   * formatting. Maximum length: 4096 characters.
   */
  children: SociablyNode;
  /**
   * Set this field to true if you want to include a URL preview box with
   * information about the link in the message.
   */
  previewUrl?: boolean;
  /** Reply to the specified message */
  replyTo?: string;
};

/**
 * Pass a text parameter into the body or header of a customized template
 *
 * @category Component
 * @props {@link TextProps}
 */
export const Text: WhatsAppComponent<
  TextProps,
  UnitSegment<WhatsAppSegmentValue>
> = makeWhatsAppComponent(async function Text(node, path, render) {
  const { children, previewUrl, replyTo } = node.props;

  const contentSegments = await render(children, '.children');
  if (
    !contentSegments ||
    contentSegments.length > 1 ||
    contentSegments[0].type !== 'text'
  ) {
    throw new TypeError('"children" prop should contain only texual content');
  }

  return [
    makeUnitSegment(node, path, {
      message: {
        type: 'text',
        text: {
          body: contentSegments[0].value,
          preview_url: previewUrl,
        },
        context: replyTo ? { message_id: replyTo } : undefined,
      },
    }),
  ];
});
