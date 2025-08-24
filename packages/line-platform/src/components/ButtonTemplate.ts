import { SociablyNode } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent.js';
import {
  LineComponent,
  MessageSegmentValue,
  TemplateMessageParams,
} from '../types.js';

/** @category Props */
export type ButtonTemplateProps = {
  /**
   * Alternative text. Displayed on devices that do not support template
   * messages. Max character limit: 400. If a function is given, the return
   * value would be used. The rendered template object is passed as the first
   * param.
   */
  altText?: string | ((message: TemplateMessageParams) => string);
  /** Image URL (Max character limit: 1,000) */
  thumbnailImageUrl?: string;
  /**
   * Aspect ratio of the image, rectangle: 1.51:1, square: 1:1. Default to
   * `'rectangle'`.
   */
  imageAspectRatio?: 'rectangle' | 'square';
  /**
   * Size of the image. Default to `'cover'`.
   *
   * - Cover: The image fills the entire image area. Parts of the image that do
   *   not fit in the area are not displayed.
   * - Contain: The entire image is displayed in the image area. A background is
   *   displayed in the unused areas to the left and right of vertical images
   *   and in the areas above and below horizontal images.
   */
  imageSize?: 'contain' | 'cover';
  /** Background color of the image. Specify a RGB color value. Default: #FFFFFF. */
  imageBackgroundColor?: string;
  title?: string;
  /**
   * Message text Max character limit: 160 (no image or title) or 60 (message
   * with an image or title)
   */
  text: string;
  /**
   * {@link Action} elements displayed as the buttons at the template. Max 4
   * buttons.
   */
  actions: SociablyNode;
  /**
   * An {@link Action} element to be triggered when image, title or text area is
   * tapped.
   */
  defaultAction?: SociablyNode;
};

/**
 * Template with an image, title, text, and multiple action buttons.
 *
 * @category Component
 * @props {@link ButtonTemplateProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#buttons).
 */
export const ButtonTemplate: LineComponent<
  ButtonTemplateProps,
  UnitSegment<MessageSegmentValue>
> = makeLineComponent(async function ButtonTemplate(node, path, render) {
  const {
    actions,
    defaultAction,
    altText,
    thumbnailImageUrl,
    imageAspectRatio,
    imageSize,
    imageBackgroundColor,
    title,
    text,
  } = node.props;

  const [defaultActionSegments, actionSegments] = await Promise.all([
    render(defaultAction, '.defaultAction'),
    render(actions, '.actions'),
  ]);

  const templateMessage: TemplateMessageParams = {
    type: 'template',
    altText: '',
    template: {
      type: 'buttons',
      thumbnailImageUrl,
      imageAspectRatio,
      imageSize,
      imageBackgroundColor,
      title,
      text,
      defaultAction: defaultActionSegments?.[0].value,
      actions: actionSegments?.map((seg) => seg.value),
    },
  };

  return [
    makeUnitSegment(node, path, {
      type: 'message',
      params: {
        ...templateMessage,
        altText:
          typeof altText === 'function'
            ? altText(templateMessage)
            : altText || `${title ?? ''}\n${text}`,
      },
    }),
  ];
});
