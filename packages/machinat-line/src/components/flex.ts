import { unitSegment, partSegment } from '@machinat/core/renderer';
import { annotateLineComponent } from '../utils';

export const FlexButton = async (node, path, render) => {
  const { action, flex, margin, height, style, color, gravity } = node.props;

  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value;

  return [
    partSegment(node, path, {
      type: 'button',
      flex,
      margin,
      height,
      style,
      color,
      gravity,
      action: actionValue,
    }),
  ];
};
annotateLineComponent(FlexButton);

const FILLER_TYPE_VALUES = { type: 'filler' };
export const FlexFiller = (node, path) => [
  partSegment(node, path, FILLER_TYPE_VALUES),
];
annotateLineComponent(FlexFiller);

export const FlexIcon = (node, path) => {
  const { url, margin, size, aspectRatio } = node.props;
  return [
    partSegment(node, path, {
      type: 'icon',
      url,
      margin,
      size,
      aspectRatio,
    }),
  ];
};
annotateLineComponent(FlexIcon);

export const FlexImage = async (node, path, render) => {
  const {
    url,
    flex,
    margin,
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
    partSegment(node, path, {
      type: 'image',
      url,
      flex,
      margin,
      align,
      gravity,
      size,
      aspectRatio,
      aspectMode,
      backgroundColor,
      action: actionValue,
    }),
  ];
};
annotateLineComponent(FlexImage);

export const FlexSeparator = (node, path) => {
  const { margin, color } = node.props;
  return [
    partSegment(node, path, {
      type: 'separator',
      margin,
      color,
    }),
  ];
};
annotateLineComponent(FlexSeparator);

export const FlexSpacer = (node, path) => [
  partSegment(node, path, {
    type: 'spacer',
    size: node.props.size,
  }),
];
annotateLineComponent(FlexSpacer);

export const FlexText = async (node, path, render) => {
  const {
    children,
    flex,
    margin,
    size,
    align,
    gravity,
    wrap,
    maxLines,
    weight,
    color,
    action,
  } = node.props;

  const textSegments = await render(children, '.children');
  const text = textSegments ? textSegments[0].value : '';

  const actionSegments = await render(action, '.action');
  const actionValues = actionSegments?.[0].value;

  return [
    partSegment(node, path, {
      type: 'text',
      text,
      flex,
      margin,
      size,
      align,
      gravity,
      wrap,
      maxLines,
      weight,
      color,
      action: actionValues,
    }),
  ];
};
annotateLineComponent(FlexText);

export const FlexBox = async (node, path, render) => {
  const { children, layout, flex, spacing, margin, action } = node.props;
  const contentSegments = await render(children, '.children');
  const contentValues = contentSegments?.map((segment) => segment.value);

  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value;

  return [
    partSegment(node, path, {
      type: 'box',
      layout,
      flex,
      spacing,
      margin,
      action: actionValue,
      contents: contentValues,
    }),
  ];
};
annotateLineComponent(FlexBox);

const createBlockComponent = (section, _childrenType) => {
  const tagName = `LineFlex${section[0].toUpperCase()}${section.slice(1)}`;

  const wrapper = {
    [tagName]: async (node, path, render) => {
      const {
        children,
        backgroundColor,
        separator,
        separatorColor,
      } = node.props;

      const contentSegments = await render(children, '.children');
      const contentValue = contentSegments?.[0].value;
      return [
        partSegment(node, path, {
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

export const FlexHeader = createBlockComponent('header', FlexBox);
export const FlexHero = createBlockComponent('hero', FlexImage);
export const FlexBody = createBlockComponent('body', FlexBox);
export const FlexFooter = createBlockComponent('footer', FlexBox);

export const FlexBubbleContainer = async (node, path, render) => {
  const { children, rightToLeft } = node.props;

  const sectionSegments = await render(children, '.children');
  const bubbleObject = (sectionSegments || []).reduce(
    (bubble, { value: section }) => ({
      ...bubble,
      [section.name]: section.content,
      styles: bubble.styles
        ? { ...bubble.styles, [section.name]: section.style }
        : section.style
        ? { [section.name]: section.style }
        : undefined,
    }),
    { type: 'bubble', direction: rightToLeft ? 'rtl' : 'ltr' }
  );

  return [partSegment(node, path, bubbleObject)];
};
annotateLineComponent(FlexBubbleContainer);

export const FlexCarouselContainer = async (node, path, render) => {
  const contentSegments = await render(node.props.children, '.children');
  const bubbleContainers = contentSegments?.map((segment) => segment.value);

  return [
    partSegment(node, path, {
      type: 'carousel',
      contents: bubbleContainers,
    }),
  ];
};
annotateLineComponent(FlexCarouselContainer);

export const FlexMessage = async (node, path, render) => {
  const { children, altText } = node.props;
  const contentSegments = await render(children, '.children');
  const contentValue = contentSegments?.[0].value;

  return [
    unitSegment(node, path, {
      type: 'flex',
      altText,
      contents: contentValue,
    }),
  ];
};
annotateLineComponent(FlexMessage);

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
