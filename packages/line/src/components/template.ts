import { MachinatNode } from '@machinat/core/types';
import { unitSegment, partSegment } from '@machinat/core/renderer';
import { PartSegment } from '@machinat/core/renderer/types';
import { annotateLineComponent } from '../utils';
import { LineComponent } from '../types';

/**
 * @category Props
 */
type ButtonTemplateProps = {
  /**
   * Alternative text. Displayed on devices that do not support template
   * messages. Max character limit: 400
   */
  altText: string;
  /** Image URL (Max character limit: 1,000) */
  thumbnailImageUrl?: string;
  /** Alias of `thumbnailImageUrl`. */
  imageUrl?: string;
  /**
   * Aspect ratio of the image, rectangle: 1.51:1, square: 1:1. Default to
   * `'rectangle'`.
   */
  imageAspectRatio?: 'rectangle' | 'square';
  /**
   * Size of the image. Default to `'cover'`.
   * - cover:   The image fills the entire image area. Parts of the image that
   *            do not fit in the area are not displayed.
   * - contain: The entire image is displayed in the image area. A background is
   *            displayed in the unused areas to the left and right of vertical
   *            images and in the areas above and below horizontal images.
   */
  imageSize?: 'contain' | 'cover';
  /**
   * Background color of the image. Specify a RGB color value. Default: #FFFFFF.
   */
  imageBackgroundColor?: string;
  title?: string;
  /** Message text. */
  text: string;
  /**
   * {@link Action} elements displayed as the buttons at the template. Max 4
   * buttons.
   */
  actions: MachinatNode;
  /**
   * An {@link Action} element to be triggered when image, title or text area is
   * tapped.
   */
  defaultAction?: MachinatNode;
};

/** @internal */
const __ButtonTemplate = async function ButtonTemplate(node, path, render) {
  const {
    actions,
    defaultAction,
    altText,
    thumbnailImageUrl,
    imageUrl,
    imageAspectRatio,
    imageSize,
    imageBackgroundColor,
    title,
    text,
  } = node.props;

  const defaultActionSegments = await render(defaultAction, '.defaultAction');
  const defaultActionValue = defaultActionSegments?.[0].value;

  const actionSegments = await render(actions, '.actions');
  const actionValues = actionSegments?.map((seg) => seg.value);

  return [
    unitSegment(node, path, {
      type: 'template' as const,
      altText,
      template: {
        type: 'buttons',
        thumbnailImageUrl: thumbnailImageUrl || imageUrl,
        imageAspectRatio,
        imageSize,
        imageBackgroundColor,
        title,
        text,
        defaultAction: defaultActionValue,
        actions: actionValues,
      },
    }),
  ];
};
/**
 * Template with an image, title, text, and multiple action buttons.
 * @category Component
 * @props {@link ButtonTemplateProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#buttons).
 */
export const ButtonTemplate: LineComponent<ButtonTemplateProps> = annotateLineComponent(
  __ButtonTemplate
);

/**
 * @category Props
 */
type ConfirmTemplateProps = {
  /**
   * Alternative text. Displayed on devices that do not support template
   * messages. Max character limit: 400
   */
  altText: string;
  /**
   * Exactly 2 {@link Action} elements displayed as the buttons at the template.
   */
  actions: MachinatNode;
  /** Message text. */
  text: string;
};

/** @internal */
const __ConfirmTemplate = async function ConfirmTemplate(node, path, render) {
  const { actions, altText, text } = node.props;
  const actionSegments = await render(actions, '.actions');
  const actionsValues = actionSegments?.map((segment) => segment.value);

  return [
    unitSegment(node, path, {
      type: 'template' as const,
      altText,
      template: {
        type: 'confirm',
        text,
        actions: actionsValues,
      },
    }),
  ];
};
/**
 * Template with two action buttons.
 * @category Component
 * @props {@link ConfirmTemplateProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#confirm).
 */
export const ConfirmTemplate: LineComponent<ConfirmTemplateProps> = annotateLineComponent(
  __ConfirmTemplate
);

/**
 * @category Props
 */
type CarouselItemProps = {
  /**
   * {@link Action} elements displayed as the buttons at the template. Max 3
   * buttons.
   */
  actions: MachinatNode;
  /**
   * An {@link Action} element to be triggered when image, title or text area is
   * tapped.
   */
  defaultAction?: MachinatNode;
  /** Image URL (Max character limit: 1,000) */
  thumbnailImageUrl?: string;
  /** Alias of `thumbnailImageUrl`. */
  imageUrl?: string;
  /**
   * Background color of the image. Specify a RGB color value. The default
   * value is #FFFFFF (white).
   */
  imageBackgroundColor?: string;
  title?: string;
  /** Message text. */
  text?: string;
};

/** @internal */
const __CarouselItem = async function CarouselItem(node, path, render) {
  const {
    actions,
    defaultAction,
    imageUrl,
    thumbnailImageUrl,
    imageBackgroundColor,
    title,
    text,
  } = node.props;

  const defaultActionSegments = await render(defaultAction, '.defaultAction');
  const defaultActionValue = defaultActionSegments?.[0].value;

  const actionSegments = await render(actions, '.actions');
  const actionValues = actionSegments?.map((segment) => segment.value);

  return [
    partSegment(node, path, {
      thumbnailImageUrl: thumbnailImageUrl || imageUrl,
      imageBackgroundColor,
      title,
      text,
      defaultAction: defaultActionValue,
      actions: actionValues,
    }),
  ];
};
/**
 * Column items of {@link CarouselTemplate}.
 * @category Component
 * @props {@link CarouselItemProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#column-object-for-carousel).
 */
export const CarouselItem: LineComponent<
  CarouselItemProps,
  PartSegment<any>
> = annotateLineComponent(__CarouselItem);

/**
 * @category Props
 */
type CarouselTemplateProps = {
  /**
   * {@link CarouselItem} elements displayed as bubble columns in the carousel.
   * Max 10 columns.
   */
  children: MachinatNode;
  /**
   * Alternative text. Displayed on devices that do not support template
   * messages. Max character limit: 400
   */
  altText: string;
  /**
   * Aspect ratio of the image, rectangle: 1.51:1, square: 1:1. Default to
   * `'rectangle'`.
   */
  imageAspectRatio?: 'rectangle' | 'square';
  /**
   * Size of the image. Default to `'cover'`.
   * - cover:   The image fills the entire image area. Parts of the image that
   *            do not fit in the area are not displayed.
   * - contain: The entire image is displayed in the image area. A background is
   *            displayed in the unused areas to the left and right of vertical
   *            images and in the areas above and below horizontal images.
   */
  imageSize?: 'contain' | 'cover';
};

/** @internal */
const __CarouselTemplate = async function CarouselTemplate(node, path, render) {
  const { children, altText, imageAspectRatio, imageSize } = node.props;
  const columnSegments = await render(children, '.children');
  const cloumnValues = columnSegments?.map((segment) => segment.value);

  return [
    unitSegment(node, path, {
      type: 'template' as const,
      altText,
      template: {
        type: 'carousel',
        imageAspectRatio,
        imageSize,
        columns: cloumnValues,
      },
    }),
  ];
};
/**
 * Template with multiple columns which can be cycled like a carousel. The
 * columns are shown in order when scrolling horizontally.
 * @category Component
 * @props {@link CarouselTemplateProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#carousel).
 */
export const CarouselTemplate: LineComponent<CarouselTemplateProps> = annotateLineComponent(
  __CarouselTemplate
);

/**
 * @category Props
 */
type ImageCarouselItemProps = {
  /** Image URL (Max character limit: 1,000) */
  imageUrl?: string;
  /** Alias of `imageUrl`. Either one of `url` and `imageUrl` must be specified. */
  url?: string;
  /** One {@link Action} element to be triggered the when image is tapped. */
  action?: MachinatNode;
};

/** @internal */
const __ImageCarouselItem = async function ImageCarouselItem(
  node,
  path,
  render
) {
  const { url, imageUrl, action } = node.props;
  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value;

  return [
    partSegment(node, path, {
      imageUrl: imageUrl || url,
      action: actionValue,
    }),
  ];
};
/**
 * Column items of {@link ImageCarouselTemplate}.
 * @category Component
 * @props {@link ImageCarouselItemProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#column-object-for-image-carousel).
 */
export const ImageCarouselItem: LineComponent<
  ImageCarouselItemProps,
  PartSegment<any>
> = annotateLineComponent(__ImageCarouselItem);

/**
 * @category Props
 */
type ImageCarouselTemplateProps = {
  /** {@link ImageCarouselItem} elements displayed as image columns in the
   * carousel. Max 10 columns.
   */
  children: MachinatNode;
  /**
   * Alternative text. Displayed on devices that do not support template
   * messages. Max character limit: 400
   */
  altText: string;
};

/** @internal */
const __ImageCarouselTemplate = async function ImageCarouselTemplate(
  node,
  path,
  render
) {
  const { children, altText } = node.props;
  const columnSegments = await render(children, '.children');
  const columnValues = columnSegments?.map((segment) => segment.value);

  return [
    unitSegment(node, path, {
      type: 'template' as const,
      altText,
      template: {
        type: 'image_carousel',
        columns: columnValues,
      },
    }),
  ];
};
/**
 * Template with multiple images which can be cycled like a carousel. The images
 * are shown in order when scrolling horizontally.
 * @category Component
 * @props {@link ImageCarouselTemplateProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#image-carousel).
 */
export const ImageCarouselTemplate: LineComponent<ImageCarouselTemplateProps> = annotateLineComponent(
  __ImageCarouselTemplate
);
