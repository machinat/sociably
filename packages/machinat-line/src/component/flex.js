import invariant from 'invariant';
import {
  annotate,
  asNative,
  asUnit,
  valuesOfAssertedType,
  joinTextValues,
} from 'machinat-utility';

import { LINE_NAITVE_TYPE } from '../symbol';
import * as _actionModule from './action';

const actionComponents = Object.values(_actionModule);
const renderActionValues = valuesOfAssertedType(...actionComponents);

export const FlexButton = (
  { action, flex, margin, height, style, color, gravity },
  render
) => {
  const actionRendered = renderActionValues(action, render, '.action');

  invariant(
    actionRendered !== undefined && actionRendered.length === 1,
    `there should be exactly 1 action in prop "action" of FlexButton, got ${
      actionRendered ? actionRendered.length : 0
    }`
  );

  return [
    {
      type: 'button',
      flex,
      margin,
      height,
      style,
      color,
      gravity,
      action: actionRendered[0],
    },
  ];
};

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(FlexButton);

const FILLER_TYPE_RENDERED = [{ type: 'filler' }];
export const FlexFiller = () => FILLER_TYPE_RENDERED;

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(FlexFiller);

export const FlexIcon = ({ url, margin, size, aspectRatio }) => [
  {
    type: 'icon',
    url,
    margin,
    size,
    aspectRatio,
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(FlexIcon);

export const FlexImage = (
  {
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
  },
  render
) => {
  const actionRendered = renderActionValues(action, render, '.action');

  return [
    {
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
      action: actionRendered && actionRendered[0],
    },
  ];
};

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(FlexImage);

export const FlexSeparator = ({ margin, color }) => [
  {
    type: 'separator',
    margin,
    color,
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(FlexSeparator);

export const FlexSpacer = ({ size }) => [
  {
    type: 'spacer',
    size,
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(FlexSpacer);

export const FlexText = (
  {
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
  },
  render
) => {
  const renderedActions = renderActionValues(action, render, '.action');
  const textValues = joinTextValues(children, render, '.children');

  let text;
  invariant(
    textValues !== undefined &&
      textValues.length === 1 &&
      typeof (text = textValues[0]) === 'string', // eslint-disable-line prefer-destructuring
    textValues
      ? `there should be no <br/> in children of <FlexText/>`
      : `children of <FlexText/> should not be empty`
  );

  return [
    {
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
      action: renderedActions && renderedActions[0],
    },
  ];
};

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(FlexText);

let renderBoxContentValue;

export const FlexBox = (
  { children, layout, flex, spacing, margin, action },
  render
) => {
  const contentRendered = renderBoxContentValue(children, render, '.children');
  const actionRendered = renderActionValues(action, render, '.action');

  invariant(
    contentRendered !== undefined,
    `children of FlexBox should not be empty`
  );

  return [
    {
      type: 'box',
      layout,
      flex,
      spacing,
      margin,
      action: actionRendered && actionRendered[0],
      contents: contentRendered,
    },
  ];
};

renderBoxContentValue = valuesOfAssertedType(
  FlexBox,
  FlexButton,
  FlexFiller,
  FlexIcon,
  FlexImage,
  FlexSeparator,
  FlexSpacer,
  FlexText
);

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(FlexBox);

export const createBlockComponent = (section, renderer) => {
  const tagName = `Flex${section[0].toUpperCase()}${section.slice(1)}`;
  const wrapper = {
    [tagName]: (
      { children, backgroundColor, separator, separatorColor },
      render
    ) => {
      const contentRendered = renderer(children, render, '.children');

      invariant(
        contentRendered !== undefined && contentRendered.length === 1,
        `there should be exactly 1 child in ${tagName}, got ${
          contentRendered ? contentRendered.length : 0
        }`
      );

      return [
        {
          name: section,
          content: contentRendered[0],
          style:
            backgroundColor || separator || separatorColor
              ? {
                  backgroundColor,
                  separator,
                  separatorColor,
                }
              : undefined,
        },
      ];
    },
  };

  return annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(wrapper[tagName]);
};

const renderBoxValues = valuesOfAssertedType(FlexBox);
const renderImagesValues = valuesOfAssertedType(FlexImage);

export const FlexHeader = createBlockComponent('header', renderBoxValues);
export const FlexHero = createBlockComponent('hero', renderImagesValues);
export const FlexBody = createBlockComponent('body', renderBoxValues);
export const FlexFooter = createBlockComponent('footer', renderBoxValues);

const renderBlockValues = valuesOfAssertedType(
  FlexHeader,
  FlexHero,
  FlexBody,
  FlexFooter
);

export const FlexBubbleContainer = ({ children, rightToLeft }, render) => {
  const bubbleObject = {
    type: 'bubble',
    direction: rightToLeft ? 'rtl' : 'ltr',
  };

  const renderedSections = renderBlockValues(children, render, '.children');

  invariant(
    renderedSections !== undefined,
    `there should be at least 1 block in children of FlexBubbleContainer`
  );

  for (let i = 0; i < renderedSections.length; i += 1) {
    const section = renderedSections[i];

    bubbleObject[section.name] = section.content;

    if (section.style !== undefined) {
      if (bubbleObject.styles === undefined) {
        bubbleObject.styles = {};
      }

      bubbleObject.style[section.name] = section.style;
    }
  }

  return [bubbleObject];
};

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(FlexBubbleContainer);

const renderBubbleContainerValues = valuesOfAssertedType(FlexBubbleContainer);

export const FlexCarouselContainer = ({ children }, render) => [
  {
    type: 'carousel',
    contents: renderBubbleContainerValues(children, render, '.children'),
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(FlexCarouselContainer);

const renderContainerValues = valuesOfAssertedType(
  FlexBubbleContainer,
  FlexCarouselContainer
);

export const FlexMessage = ({ children, alt, altText }, render) => {
  const containersRendered = renderContainerValues(
    children,
    render,
    '.children'
  );

  invariant(
    containersRendered !== undefined && containersRendered.length === 1,
    `there should be exactly 1 conatiner in children of FlexMessage, got ${
      containersRendered ? containersRendered.length : 0
    }`
  );

  return [
    {
      type: 'flex',
      altText: altText || alt,
      contents: containersRendered[0],
    },
  ];
};

annotate(asNative(LINE_NAITVE_TYPE), asUnit(true))(FlexMessage);

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
