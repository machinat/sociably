import { MachinatNode } from '@machinat/core/types';
import { unitSegment, partSegment } from '@machinat/core/renderer';
import { PartSegment, FunctionOf } from '@machinat/core/renderer/types';
import { annotateLineComponent } from '../utils';
import { LineComponent } from '../types';

/**
 * @category Props
 */
type ButtonTemplateProps = {
  /**
   * Alternative text. Displayed on devices that do not support template
   * messages. Max character limit: 400.
   * If a function is given, the return value would be used. The rendered
   * template object is passed as the first argument.
   */
  altText: string | ((template: Record<string, unknown>) => string);
  /** Image URL (Max character limit: 1,000) */
  thumbnailImageUrl?: string;
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
  /** Texual nodes of message text. */
  children: MachinatNode;
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
const __ButtonTemplate: FunctionOf<LineComponent<
  ButtonTemplateProps
>> = async function ButtonTemplate(node, path, render) {
  const {
    actions,
    defaultAction,
    altText,
    thumbnailImageUrl,
    imageAspectRatio,
    imageSize,
    imageBackgroundColor,
    title,
    children,
  } = node.props;

  const [
    defaultActionSegments,
    actionSegments,
    textSegments,
  ] = await Promise.all([
    render(defaultAction, '.defaultAction'),
    render(actions, '.actions'),
    render(children, '.children'),
  ]);

  const template = {
    type: 'buttons',
    thumbnailImageUrl,
    imageAspectRatio,
    imageSize,
    imageBackgroundColor,
    title,
    text: textSegments?.[0].value,
    defaultAction: defaultActionSegments?.[0].value,
    actions: actionSegments?.map((seg) => seg.value),
  };

  return [
    unitSegment(node, path, {
      type: 'template' as const,
      altText: typeof altText === 'function' ? altText(template) : altText,
      template,
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
   * If a function is given, the return value would be used. The rendered
   * template object is passed as the first argument.
   */
  altText: string | ((template: Record<string, unknown>) => string);
  /**
   * Exactly 2 {@link Action} elements displayed as the buttons at the template.
   */
  actions: MachinatNode;
  /** Texual nodes of message text. */
  children: string;
};

/** @internal */
const __ConfirmTemplate: FunctionOf<LineComponent<
  ConfirmTemplateProps
>> = async function ConfirmTemplate(node, path, render) {
  const { actions, altText, children } = node.props;
  const [actionSegments, textSegments] = await Promise.all([
    render(actions, '.actions'),
    render(children, '.children'),
  ]);

  const template = {
    type: 'confirm',
    text: textSegments?.[0].value,
    actions: actionSegments?.map((segment) => segment.value),
  };

  return [
    unitSegment(node, path, {
      type: 'template' as const,
      altText: typeof altText === 'function' ? altText(template) : altText,
      template,
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
  /**
   * Background color of the image. Specify a RGB color value. The default
   * value is #FFFFFF (white).
   */
  imageBackgroundColor?: string;
  title?: string;
  /** Texual nodes of message text. */
  children: string;
};

/** @internal */
const __CarouselItem: FunctionOf<LineComponent<
  CarouselItemProps,
  PartSegment<any>
>> = async function CarouselItem(node, path, render) {
  const {
    actions,
    defaultAction,
    thumbnailImageUrl,
    imageBackgroundColor,
    title,
    children,
  } = node.props;

  const [
    defaultActionSegments,
    actionSegments,
    textSegments,
  ] = await Promise.all([
    render(defaultAction, '.defaultAction'),
    render(actions, '.actions'),
    render(children, '.children'),
  ]);

  return [
    partSegment(node, path, {
      thumbnailImageUrl,
      imageBackgroundColor,
      title,
      text: textSegments?.[0].value,
      defaultAction: defaultActionSegments?.[0].value,
      actions: actionSegments?.map((segment) => segment.value),
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
   * If a function is given, the return value would be used. The rendered
   * template object is passed as the first argument.
   */
  altText: string | ((template: Record<string, unknown>) => string);
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
const __CarouselTemplate: FunctionOf<LineComponent<
  CarouselTemplateProps
>> = async function CarouselTemplate(node, path, render) {
  const { children, altText, imageAspectRatio, imageSize } = node.props;
  const columnSegments = await render(children, '.children');

  const template = {
    type: 'carousel',
    imageAspectRatio,
    imageSize,
    columns: columnSegments?.map((segment) => segment.value),
  };

  return [
    unitSegment(node, path, {
      type: 'template' as const,
      altText: typeof altText === 'function' ? altText(template) : altText,
      template,
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
  imageUrl: string;
  /** One {@link Action} element to be triggered the when image is tapped. */
  action?: MachinatNode;
};

/** @internal */
const __ImageCarouselItem: FunctionOf<LineComponent<
  ImageCarouselItemProps,
  PartSegment<any>
>> = async function ImageCarouselItem(node, path, render) {
  const { imageUrl, action } = node.props;
  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value;

  return [
    partSegment(node, path, {
      imageUrl,
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
   * If a function is given, the return value would be used. The rendered
   * template object is passed as the first argument.
   */
  altText: string | ((template: Record<string, unknown>) => string);
};

/** @internal */
const __ImageCarouselTemplate: FunctionOf<LineComponent<
  ImageCarouselTemplateProps
>> = async function ImageCarouselTemplate(node, path, render) {
  const { children, altText } = node.props;
  const columnSegments = await render(children, '.children');

  const template = {
    type: 'image_carousel',
    columns: columnSegments?.map((segment) => segment.value),
  };

  return [
    unitSegment(node, path, {
      type: 'template' as const,
      altText: typeof altText === 'function' ? altText(template) : altText,
      template,
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
