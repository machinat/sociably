import { SociablyNode } from '@sociably/core';
import {
  makeUnitSegment,
  makePartSegment,
  UnitSegment,
  PartSegment,
} from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent.js';
import { LineComponent, MessageSegmentValue } from '../types.js';

/**
 * @category Props
 */
export type ImageCarouselItemProps = {
  /** Image URL (Max character limit: 1,000) */
  imageUrl: string;
  /** One {@link Action} element to be triggered the when image is tapped. */
  action?: SociablyNode;
};

/**
 * Column items of {@link ImageCarouselTemplate}.
 * @category Component
 * @props {@link ImageCarouselItemProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#column-object-for-image-carousel).
 */
export const ImageCarouselItem: LineComponent<
  ImageCarouselItemProps,
  PartSegment<{}>
> = makeLineComponent(async function ImageCarouselItem(node, path, render) {
  const { imageUrl, action } = node.props;
  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value;

  return [
    makePartSegment(node, path, {
      imageUrl,
      action: actionValue,
    }),
  ];
});

/**
 * @category Props
 */
export type ImageCarouselTemplateProps = {
  /** {@link ImageCarouselItem} elements displayed as image columns in the
   * carousel. Max 10 columns.
   */
  children: SociablyNode;
  /**
   * Alternative text. Displayed on devices that do not support template
   * messages. Max character limit: 400
   * If a function is given, the return value would be used. The rendered
   * template object is passed as the first param.
   */
  altText: string | ((template: Record<string, any>) => string);
};

/**
 * Template with multiple images which can be cycled like a carousel. The images
 * are shown in order when scrolling horizontally.
 * @category Component
 * @props {@link ImageCarouselTemplateProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#image-carousel).
 */
export const ImageCarouselTemplate: LineComponent<
  ImageCarouselTemplateProps,
  UnitSegment<MessageSegmentValue>
> = makeLineComponent(async function ImageCarouselTemplate(node, path, render) {
  const { children, altText } = node.props;
  const columnSegments = await render(children, '.children');

  const template = {
    type: 'image_carousel',
    columns: columnSegments?.map((segment) => segment.value),
  };

  return [
    makeUnitSegment(node, path, {
      type: 'message',
      params: {
        type: 'template',
        altText: typeof altText === 'function' ? altText(template) : altText,
        template,
      },
    }),
  ];
});
