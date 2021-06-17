import invariant from 'invariant';
import type { MachinatNode } from '@machinat/core';
import {
  makeUnitSegment,
  makePartSegment,
  UnitSegment,
  PartSegment,
} from '@machinat/core/renderer';
import formatNode from '@machinat/core/utils/formatNode';
import { annotateLineComponent } from '../utils';
import type { LineComponent, FlexSegmentValue } from '../types';

type FlexSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
type FlexFullSize = 'xxs' | FlexSize | '3xl' | '4xl' | '5xl';
type FlexAlign = 'start' | 'end' | 'center';
type FlexGravity = 'top' | 'bottom' | 'center';

/**
 * @category Props
 */
export type FlexButtonProps = {
  /** An {@link Action} element performed when this button is tapped. */
  action?: MachinatNode;
  /**
   * The ratio of the width or height of this component within the parent box.
   */
  flex?: number;
  /**
   * Minimum space between this component and the previous component in the
   * parent element
   */
  margin?: 'none' | FlexSize;
  /**
   * Reference for offsetTop, offsetBottom, offsetStart, and offsetEnd. The
   * default value is relative.
   */
  position?: 'relative' | 'absolute';
  /** The top offset. */
  offsetTop?: number | string | 'none' | FlexSize;
  /** The bottom offset. */
  offsetBottom?: number | string | 'none' | FlexSize;
  /** The left offset. */
  offsetStart?: number | string | 'none' | FlexSize;
  /** The right offset. */
  offsetEnd?: number | string | 'none' | FlexSize;
  /**
   * Background color of the block. In addition to the RGB color, an alpha
   * channel (transparency) can also be set. Use a hexadecimal color code.
   * (Example:#RRGGBBAA) The default value is #00000000.
   */
  backgroundColor?: string;
  /** Height of the button. */
  height?: 'sm' | 'md';
  /** Style of the button. The default value is link. */
  style?: 'primary' | 'secondary' | 'link';
  /**
   * Character color when the style property is link. Background color when the
   * style property is primary or secondary. Use a hexadecimal color code.
   */
  color?: string;
  /** Alignment style in vertical direction. Default to `top` */
  gravity?: FlexGravity;
};

/**
 * FlexButton renders a button. When the user taps a button, a specified action
 * is performed.
 * @category Component
 * @props {@link FlexButtonProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#button).
 */
export const FlexButton: LineComponent<
  FlexButtonProps,
  PartSegment<any>
> = annotateLineComponent(async function FlexButton(node, path, render) {
  const {
    action,
    flex,
    margin,
    position,
    offsetTop,
    offsetBottom,
    offsetStart,
    offsetEnd,
    backgroundColor,
    height,
    style,
    color,
    gravity,
  } = node.props;

  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value;

  return [
    makePartSegment(node, path, {
      type: 'button',
      flex,
      margin,
      position,
      offsetTop,
      offsetBottom,
      offsetStart,
      offsetEnd,
      backgroundColor,
      height,
      style,
      color,
      gravity,
      action: actionValue,
    }),
  ];
});

/**
 * @category Props
 */
export type FlexFillerProps = {
  /**
   * The ratio of the width or height of this component within the parent box.
   */
  flex?: number;
};

/**
 * FlexFiller is used to create a space. You can put a space between,
 * before, or after components by inserting a filler anywhere within a box.
 * @category Component
 * @props {@link FlexFillerProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#filler).
 */
export const FlexFiller: LineComponent<
  FlexFillerProps,
  PartSegment<any>
> = annotateLineComponent(function FlexFiller(node, path) {
  return [
    makePartSegment(node, path, {
      type: 'filler',
      flex: node.props.flex,
    }),
  ];
});

/**
 * @category Props
 */
export type FlexIconProps = {
  /** Image URL */
  url: string;
  /**
   * Minimum space between this component and the previous component in the
   * parent element
   */
  margin?: 'none' | FlexSize;
  /**
   * Reference for offsetTop, offsetBottom, offsetStart, and offsetEnd. The
   * default value is relative.
   */
  position?: 'relative' | 'absolute';
  /** The top offset. */
  offsetTop?: number | string | 'none' | FlexSize;
  /** The bottom offset. */
  offsetBottom?: number | string | 'none' | FlexSize;
  /** The left offset. */
  offsetStart?: number | string | 'none' | FlexSize;
  /** The right offset. */
  offsetEnd?: number | string | 'none' | FlexSize;
  /** Maximum size of the icon width. The default value is md. */
  size?: FlexFullSize;
  /**
   * Aspect ratio of the icon. {width}:{height} format. The values of {width}
   * and {height} must be in the range 1–100000. {height} can't be more than
   * three times the value of {width}. The default value is 1:1.
   */
  aspectRatio?: string;
};

/**
 * FlexIconProps renders an icon for decorating the adjacent text.
 * @category Component
 * @props {@link FlexIconProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#icon).
 */
export const FlexIcon: LineComponent<
  FlexIconProps,
  PartSegment<any>
> = annotateLineComponent(function FlexIcon(node, path) {
  const {
    url,
    margin,
    position,
    offsetTop,
    offsetBottom,
    offsetStart,
    offsetEnd,
    size,
    aspectRatio,
  } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'icon',
      url,
      margin,
      position,
      offsetTop,
      offsetBottom,
      offsetStart,
      offsetEnd,
      size,
      aspectRatio,
    }),
  ];
});

/**
 * @category Props
 */
export type FlexImageProps = {
  /** Image URL */
  url: string;
  /**
   * The ratio of the width or height of this component within the parent box.
   */
  flex?: number;
  /**
   * Minimum space between this component and the previous component in the
   * parent element
   */
  margin?: 'none' | FlexSize;
  /**
   * Reference for offsetTop, offsetBottom, offsetStart, and offsetEnd. The
   * default value is relative.
   */
  position?: 'relative' | 'absolute';
  /** The top offset. */
  offsetTop?: number | string | 'none' | FlexSize;
  /** The bottom offset. */
  offsetBottom?: number | string | 'none' | FlexSize;
  /** The left offset. */
  offsetStart?: number | string | 'none' | FlexSize;
  /** The right offset. */
  offsetEnd?: number | string | 'none' | FlexSize;
  /** Alignment style in horizontal direction. */
  align?: FlexAlign;
  /** Alignment style in vertical direction. */
  gravity?: FlexGravity;
  /** Maximum size of the image width. */
  size?: FlexFullSize;
  /**
   * Aspect ratio of the image. {width}:{height} format. The values of {width}
   * and {height} must be in the range 1–100000. {height} can't be more than
   * three times the value of {width}. The default value is 1:1.
   */
  aspectRatio?: string;
  /**
   * The display style of the image if the aspect ratio of the image and that
   * specified by the aspectRatio property do not match.
   */
  aspectMode?: 'cover' | 'fit';
  /** Background color of the image. Use a hexadecimal color code. */
  backgroundColor?: string;
  /** An {@link Action} element performed when this image is tapped. */
  action?: MachinatNode;
};

/**
 * FlexImage renders an image.
 * @category Component
 * @props {@link FlexImageProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#f-image).
 */
export const FlexImage: LineComponent<
  FlexImageProps,
  PartSegment<any>
> = annotateLineComponent(async function FlexImage(node, path, render) {
  const {
    url,
    flex,
    margin,
    position,
    offsetTop,
    offsetBottom,
    offsetStart,
    offsetEnd,
    align,
    gravity,
    size,
    aspectRatio,
    aspectMode,
    backgroundColor,
    action,
  } = node.props;

  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value;

  return [
    makePartSegment(node, path, {
      type: 'image',
      url,
      flex,
      margin,
      position,
      offsetTop,
      offsetBottom,
      offsetStart,
      offsetEnd,
      align,
      gravity,
      size,
      aspectRatio,
      aspectMode,
      backgroundColor,
      action: actionValue,
    }),
  ];
});

/**
 * @category Props
 */
export type FlextSeparatorProps = {
  /**
   * Minimum space between this component and the previous component in the
   * parent element.
   */
  margin?: 'none' | FlexSize;
  /** Color of the separator. Use a hexadecimal color code. */
  color?: string;
};

/**
 * FlexImage renders an image.
 * @category Component
 * @props {@link FlextSeparatorProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#separator).
 */
export const FlexSeparator: LineComponent<
  FlextSeparatorProps,
  PartSegment<any>
> = annotateLineComponent(function FlexSeparator(node, path) {
  const { margin, color } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'separator',
      margin,
      color,
    }),
  ];
});

/**
 * @category Props
 */
export type FlexSpacerProps = {
  /** Size of the space. */
  size?: FlexSize;
};

/**
 * Not recommended. Use box padding instead.
 * @category Component
 * @props {@link FlexSpacerProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#spacer).
 */
export const FlexSpacer: LineComponent<
  FlexSpacerProps,
  PartSegment<any>
> = annotateLineComponent(function FlexSpacer(node, path) {
  return [
    makePartSegment(node, path, {
      type: 'spacer',
      size: node.props.size,
    }),
  ];
});

/**
 * @category Props
 */
export type FlexTextProps = {
  /** Texual nodes and {@link FlexSpan} elements as the content text. */
  children: MachinatNode;
  /**
   * The ratio of the width or height of this component within the parent box.
   */
  flex?: number;
  /**
   * Minimum space between this component and the previous component in the
   * parent element
   */
  margin?: 'none' | FlexSize;
  /**
   * Reference for offsetTop, offsetBottom, offsetStart, and offsetEnd. The
   * default value is relative.
   */
  position?: 'relative' | 'absolute';
  /** The top offset. */
  offsetTop?: number | string | 'none' | FlexSize;
  /** The bottom offset. */
  offsetBottom?: number | string | 'none' | FlexSize;
  /** The left offset. */
  offsetStart?: number | string | 'none' | FlexSize;
  /** The right offset. */
  offsetEnd?: number | string | 'none' | FlexSize;
  /** Alignment style in horizontal direction. */
  align?: FlexAlign;
  /** Alignment style in vertical direction. */
  gravity?: FlexGravity;
  /** Font size. */
  size?: FlexFullSize;
  /**
   * `true` to wrap text. The default value is false. If set to `true`, you can
   * use a new line character `\n` to begin on a new line.
   */
  wrap?: boolean;
  /**
   * Max number of lines. If the text does not fit in the specified number of
   * lines, an ellipsis (…) is displayed at the end of the last line. If set to
   * 0, all the text is displayed. The default value is 0.
   */
  maxLines?: number;
  /** Font weight. The default value is regular. */
  weight?: 'regular' | 'bold';
  /** Font color. Use a hexadecimal color code. */
  color?: string;
  /** An {@link Action} element performed when this image is tapped. */
  action?: MachinatNode;
  /** Style of the text. */
  style?: 'normal' | 'italic';
  /** Decoration of the text. */
  decoration?: 'none' | 'underline' | 'line-through';
};

/**
 * FlexText renders a text string in one row.
 * @category Component
 * @props {@link FlexTextProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#f-text).
 */
export const FlexText: LineComponent<
  FlexTextProps,
  PartSegment<any>
> = annotateLineComponent(async function FlexText(node, path, render) {
  const {
    children,
    flex,
    margin,
    position,
    offsetTop,
    offsetBottom,
    offsetStart,
    offsetEnd,
    size,
    align,
    gravity,
    wrap,
    maxLines,
    weight,
    color,
    action,
    style,
    decoration,
  } = node.props;

  const textSegments = await render(children, '.children');

  let text = '';
  let contents;

  if (!textSegments) {
    text = '';
  } else if (textSegments.length === 1 && textSegments[0].type === 'text') {
    text = textSegments?.[0].value || '';
  } else {
    contents = textSegments.reduce((spans, { type, value, node: spanNode }) => {
      if (type === 'text') {
        spans.push({ type: 'span', text: value });
      } else if (type === 'part' || type === 'raw') {
        spans.push(value);
      } else {
        invariant(
          type === 'break',
          `invalid children ${formatNode(
            spanNode
          )} received, only <FlexSpan/> and text allowed`
        );
      }
      return spans;
    }, [] as any[]);
  }

  const actionSegments = await render(action, '.action');
  const actionValues = actionSegments?.[0].value;

  return [
    makePartSegment(node, path, {
      type: 'text',
      text,
      contents,
      flex,
      margin,
      position,
      offsetTop,
      offsetBottom,
      offsetStart,
      offsetEnd,
      size,
      align,
      gravity,
      wrap,
      maxLines,
      weight,
      color,
      style,
      decoration,
      action: actionValues,
    }),
  ];
});

/**
 * @category Props
 */
export type FlexSpanProps = {
  /** Content textual nodes. */
  children: MachinatNode;
  /** Font size. */
  size?: FlexFullSize;
  /** Font weight. The default value is regular. */
  weight?: 'regular' | 'bold';
  /** Font color. Use a hexadecimal color code. */
  color?: string;
  /** Style of the text. */
  style?: 'normal' | 'italic';
  /** Decoration of the text. */
  decoration?: 'none' | 'underline' | 'line-through';
};

/**
 * FlexSpan renders multiple text strings with different designs in one row.
 * A FlexSpan element can only be placed under FlexText children.
 * @category Component
 * @props {@link FlexSpanProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#span).
 */
export const FlexSpan: LineComponent<
  FlexSpanProps,
  PartSegment<any>
> = annotateLineComponent(async function FlexBox(node, path, render) {
  const { children, size, weight, color, style, decoration } = node.props;

  const textSegments = await render(children, '.children');
  const text = textSegments?.[0].value || '';

  return [
    makePartSegment(node, path, {
      type: 'span',
      text,
      size,
      weight,
      color,
      style,
      decoration,
    }),
  ];
});

/**
 * @category Props
 */
export type FlexBoxProps = {
  /** Content nodes. */
  children: MachinatNode;
  /** The layout style of components in this box. */
  layout?: 'horizontal' | 'vertical' | 'baseline';
  /**
   * The ratio of the width or height of this component within the parent box.
   */
  flex?: number;
  /**
   * Minimum space between components in this box. The default value is none.
   */
  spacing?: 'none' | FlexSize;
  /**
   * Minimum space between this component and the previous component in the
   * parent element
   */
  margin?: 'none' | FlexSize;
  /** Free space between the borders of this box and the child element. */
  paddingAll?: number | string | 'none' | FlexSize;
  /**
   * Free space between the border at the upper end of this box and the upper
   * end of the child element.
   */
  paddingTop?: number | string | 'none' | FlexSize;
  /**
   * Free space between the border at the lower end of this box and the lower
   * end of the child element.
   */
  paddingBottom?: number | string | 'none' | FlexSize;
  /**
   * Free space between the border at the left end of this box and the left end
   * of the child element.
   */
  paddingStart?: number | string | 'none' | FlexSize;
  /**
   * Free space between the border at the right end of this box and the right
   * end of the child element.
   */
  paddingEnd?: number | string | 'none' | FlexSize;
  /**
   * Reference position for placing this box. The default value is `relative`.
   */
  position?: 'relative' | 'absolute';
  /** The top offset. */
  offsetTop?: number | string | 'none' | FlexSize;
  /** The bottom offset. */
  offsetBottom?: number | string | 'none' | FlexSize;
  /** The left offset. */
  offsetStart?: number | string | 'none' | FlexSize;
  /** The right offset. */
  offsetEnd?: number | string | 'none' | FlexSize;
  /** An {@link Action} element performed when this image is tapped. */
  action?: MachinatNode;
  /**
   * Background color of the block. In addition to the RGB color, an alpha
   * channel (transparency) can also be set. Use a hexadecimal color code.
   * (Example:#RRGGBBAA) The default value is #00000000.
   */
  backgroundColor?: string;
  /** Color of box border. Use a hexadecimal color code. */
  borderColor?: string;
  /** Width of box border. */
  borderWidth?:
    | number
    | 'none'
    | 'light'
    | 'normal'
    | 'medium'
    | 'semi-bold'
    | 'bold';
  /** Radius at the time of rounding the corners of the border. */
  cornerRadius?: number | 'none' | FlexSize;
  /**
   * The width of a box. You can specify in % (the percentage with reference to
   * the width of the parent element) or in pixels.
   */
  width?: number | string;
  /**
   * The height of a box. You can specify in % (the percentage with reference to
   * the height of the parent element) or in pixels.
   */
  height?: number | string;
};

/**
 * FlexBox is a component that defines the layout of child components. You can
 * also include a box in a box.
 * @category Component
 * @props {@link FlexBoxProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#box).
 */
export const FlexBox: LineComponent<
  FlexBoxProps,
  PartSegment<any>
> = annotateLineComponent(async function FlexBox(node, path, render) {
  const {
    children,
    layout,
    flex,
    spacing,
    margin,
    paddingAll,
    paddingTop,
    paddingBottom,
    paddingStart,
    paddingEnd,
    position,
    offsetTop,
    offsetBottom,
    offsetStart,
    offsetEnd,
    action,
    backgroundColor,
    borderColor,
    borderWidth,
    cornerRadius,
    width,
    height,
  } = node.props;
  const contentSegments = await render(children, '.children');
  const contentValues = contentSegments?.map((segment) => segment.value);

  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value;

  return [
    makePartSegment(node, path, {
      type: 'box',
      contents: contentValues,
      action: actionValue,
      layout,
      flex,
      spacing,
      margin,
      paddingAll,
      paddingTop,
      paddingBottom,
      paddingStart,
      paddingEnd,
      position,
      offsetTop,
      offsetBottom,
      offsetStart,
      offsetEnd,
      backgroundColor,
      borderColor,
      borderWidth,
      cornerRadius,
      width,
      height,
    }),
  ];
});

type BlockStyle = {
  backgroundColor?: string;
  separator?: boolean;
  separatorColor?: string;
};

type BubbleBlock = {
  name: string;
  content: MachinatNode;
  style?: BlockStyle;
};

/**
 * @category Props
 */
export type FlexBlockProps = {
  /** Exactly one content node of the block. */
  children: MachinatNode;
  /** Background color of the block. Use a hexadecimal color code. */
  backgroundColor?: string;
  /** `true` to place a separator above the block. Default to `false`. */
  separator?: boolean;
  /** Color of the separator. Use a hexadecimal color code. */
  separatorColor?: string;
};

const createBlockComponent = (section, _childrenType) => {
  const tagName = `LineFlex${section[0].toUpperCase()}${section.slice(1)}`;

  const wrapper = {
    [tagName]: async (node, path, render) => {
      const { children, backgroundColor, separator, separatorColor } =
        node.props;

      const contentSegments = await render(children, '.children');
      const contentValue = contentSegments?.[0].value;
      return [
        makePartSegment(node, path, {
          name: section,
          content: contentValue,
          style:
            backgroundColor || separator || separatorColor
              ? {
                  backgroundColor,
                  separator,
                  separatorColor,
                }
              : undefined,
        }),
      ];
    },
  };

  return annotateLineComponent(wrapper[tagName]);
};

/**
 * Header block. Specify a {@link FlexBox} in the children.
 * @category Component
 * @props {@link FlexBlockProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#bubble).
 */
export const FlexHeader: LineComponent<
  FlexBlockProps,
  PartSegment<any>
> = createBlockComponent('header', FlexBox);

/**
 * Hero block. Specify a {@link FlexBox} or {@link FlexImage} in the children.
 * @category Component
 * @props {@link FlexBlockProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#bubble).
 */
export const FlexHero: LineComponent<
  FlexBlockProps,
  PartSegment<any>
> = createBlockComponent('hero', FlexImage);

/**
 * Body block. Specify a {@link FlexBox} in the children.
 * @category Component
 * @props {@link FlexBlockProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#bubble).
 */
export const FlexBody: LineComponent<
  FlexBlockProps,
  PartSegment<any>
> = createBlockComponent('body', FlexBox);

/**
 * Footer block. Specify a {@link FlexBox} in the children.
 * @category Component
 * @props {@link FlexBlockProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#bubble).
 */
export const FlexFooter: LineComponent<
  FlexBlockProps,
  PartSegment<any>
> = createBlockComponent('footer', FlexBox);

/**
 * @category Props
 */
export type FlexBubbleContainerProps = {
  /**
   * Bubble block elements including {@link FlexHeader}, {@link FlexHero},
   * {@link FlexBody} and {@flex FlexFooter}. Each kind of bubble part should
   * present no more than once.
   */
  children: MachinatNode;
  /**
   * Text directionality and the direction of placement of components in
   * horizontal boxes.
   */
  direction?: 'rtl' | 'ltr';
  /** Alias of `direction="rtl"` when set to `true`. */
  rightToLeft?: boolean;
  /** An {@link Action} element performed when this image is tapped. */
  action?: MachinatNode;
};

/**
 * FlexBubbleContainer is a container that contains one message bubble. It can
 * contain four blocks: header, hero, body, and footer. The maximum size of JSON
 * data that defines a bubble is 10 KB.
 * @category Component
 * @props {@link FlexBubbleContainerProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#bubble).
 */
export const FlexBubbleContainer: LineComponent<
  FlexBubbleContainerProps,
  PartSegment<any>
> = annotateLineComponent(async function FlexBubbleContainer(
  node,
  path,
  render
) {
  const { children, direction, rightToLeft, action } = node.props;
  const actionSegments = await render(action, '.action');
  const sectionSegments = await render(children, '.children');

  const bubbleObject = (sectionSegments || []).reduce(
    (bubble, { value: section }: PartSegment<BubbleBlock>) => {
      /* eslint-disable no-param-reassign */
      bubble[section.name] = section.content;

      if (section.style) {
        if (!bubble.styles) {
          bubble.styles = {};
        }
        bubble.styles[section.name] = section.style;
      }
      /* eslint-enable no-param-reassign */
      return bubble;
    },
    {
      type: 'bubble',
      direction: direction || rightToLeft ? 'rtl' : 'ltr',
      action: actionSegments?.[0].value,
      styles: undefined as undefined | Record<string, BlockStyle>,
    }
  );

  return [makePartSegment(node, path, bubbleObject)];
});

/**
 * @category Props
 */
export type FlexCarouselContainerProps = {
  /** {@link FlexBubbleContainer} elements in the carousel. Max: 10 bubbles */
  children: MachinatNode;
};

/**
 * A carousel is a container that contains multiple bubbles as child elements.
 * Users can scroll horizontally through the bubbles.
 * @category Component
 * @props {@link FlexCarouselContainerProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#f-carousel).
 */
export const FlexCarouselContainer: LineComponent<
  FlexCarouselContainerProps,
  PartSegment<any>
> = annotateLineComponent(async function FlexCarouselContainer(
  node,
  path,
  render
) {
  const contentSegments = await render(node.props.children, '.children');
  const bubbleContainers = contentSegments?.map((segment) => segment.value);

  return [
    makePartSegment(node, path, {
      type: 'carousel',
      contents: bubbleContainers,
    }),
  ];
});

/**
 * @category Props
 */
export type FlexMessageProps = {
  /** {@link FlexBubbleContainer} or {@link FlexCarouselContainer} element. */
  children: MachinatNode;
  /** Alternative text. Max character limit: 400 */
  altText: string;
};

/**
 * Flex Messages are messages with a customizable layout. You can customize the
 * layout freely based on the specification for CSS Flexible Box (CSS Flexbox).
 * @category Component
 * @props {@link FlexMessageProps}
 * @guides Check official [doc](https://developers.line.biz/en/docs/messaging-api/using-flex-messages/)
 *   and [reference](https://developers.line.biz/en/reference/messaging-api/#flex-message).
 */
export const FlexMessage: LineComponent<
  FlexMessageProps,
  UnitSegment<FlexSegmentValue>
> = annotateLineComponent(async function FlexMessage(node, path, render) {
  const { children, altText } = node.props;
  const contentSegments = await render(children, '.children');
  const contentValue = contentSegments?.[0].value;

  return [
    makeUnitSegment(node, path, {
      type: 'flex' as const,
      altText,
      contents: contentValue,
    }),
  ];
});

export default {
  Box: FlexBox,
  Button: FlexButton,
  Filler: FlexFiller,
  Icon: FlexIcon,
  Image: FlexImage,
  Separator: FlexSeparator,
  Spacer: FlexSpacer,
  Text: FlexText,
  Header: FlexHeader,
  Hero: FlexHero,
  Body: FlexBody,
  Footer: FlexFooter,
  BubbleContainer: FlexBubbleContainer,
  CarouselContainer: FlexCarouselContainer,
  Message: FlexMessage,
};
