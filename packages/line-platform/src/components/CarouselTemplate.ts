import { SociablyNode } from '@sociably/core';
import {
  makeUnitSegment,
  makePartSegment,
  UnitSegment,
  PartSegment,
} from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent.js';
import {
  LineComponent,
  MessageSegmentValue,
  TemplateMessageParams,
} from '../types.js';

/** @category Props */
export type CarouselItemProps = {
  /**
   * {@link Action} elements displayed as the buttons at the template. Max 3
   * buttons.
   */
  actions: SociablyNode;
  /**
   * An {@link Action} element to be triggered when image, title or text area is
   * tapped.
   */
  defaultAction?: SociablyNode;
  /** Image URL (Max character limit: 1,000) */
  thumbnailImageUrl?: string;
  /**
   * Background color of the image. Specify a RGB color value. The default value
   * is #FFFFFF (white).
   */
  imageBackgroundColor?: string;
  title?: string;
  /**
   * Message text Max character limit: 120 (no image or title) or 60 (message
   * with an image or title)
   */
  text: string;
};

/**
 * Column items of {@link CarouselTemplate}.
 *
 * @category Component
 * @props {@link CarouselItemProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#column-object-for-carousel).
 */
export const CarouselItem: LineComponent<
  CarouselItemProps,
  PartSegment<{}>
> = makeLineComponent(async function CarouselItem(node, path, render) {
  const {
    actions,
    defaultAction,
    thumbnailImageUrl,
    imageBackgroundColor,
    title,
    text,
  } = node.props;

  const [defaultActionSegments, actionSegments] = await Promise.all([
    render(defaultAction, '.defaultAction'),
    render(actions, '.actions'),
  ]);

  return [
    makePartSegment(node, path, {
      thumbnailImageUrl,
      imageBackgroundColor,
      title,
      text,
      defaultAction: defaultActionSegments?.[0].value,
      actions: actionSegments?.map((segment) => segment.value),
    }),
  ];
});

/** @category Props */
export type CarouselTemplateProps = {
  /**
   * {@link CarouselItem} elements displayed as bubble columns in the carousel.
   * Max 10 columns.
   */
  children: SociablyNode;
  /**
   * Alternative text. Displayed on devices that do not support template
   * messages. Max character limit: 400 If a function is given, the return value
   * would be used. The rendered template object is passed as the first param.
   */
  altText?: string | ((message: TemplateMessageParams) => string);
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
};

/**
 * Template with multiple columns which can be cycled like a carousel. The
 * columns are shown in order when scrolling horizontally.
 *
 * @category Component
 * @props {@link CarouselTemplateProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#carousel).
 */
export const CarouselTemplate: LineComponent<
  CarouselTemplateProps,
  UnitSegment<MessageSegmentValue>
> = makeLineComponent(async function CarouselTemplate(node, path, render) {
  const { children, altText, imageAspectRatio, imageSize } = node.props;
  const columnSegments = await render(children, '.children');

  const templateMessage: TemplateMessageParams = {
    type: 'template',
    altText: '',
    template: {
      type: 'carousel',
      imageAspectRatio,
      imageSize,
      columns: columnSegments?.map((segment) => segment.value) || [],
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
            : altText ||
              templateMessage.template.columns
                .map((column) => `${column.title}\n${column.text}\n`)
                .join('\n'),
      },
    }),
  ];
});
