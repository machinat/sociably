import {
  annotateNativeRoot,
  annotateNative,
  renderTextContent,
  getValue,
} from 'machinat-renderer';
import { LINE_NAITVE_TYPE } from '../symbol';
import { renderQuickReplies } from './utils';

export const FlexBox = (
  { children, layout, flex, spacing, margin, action },
  render
) => {
  const contentRendered = render(children, '.children');
  const actionRendered = render(action, '.action');
  if (__DEV__) {
    // TODO: validate contentRendered & actionRendered
  }

  return {
    type: 'box',
    layout,
    flex,
    spacing,
    margin,
    action: actionRendered && actionRendered[0].value,
    contents: contentRendered && contentRendered.map(getValue),
  };
};

annotateNative(FlexBox, LINE_NAITVE_TYPE);

export const FlexButton = (
  { action, flex, margin, height, style, color, gravity },
  render
) => {
  const actionRendered = render(action, '.action');
  if (__DEV__) {
    // TODO: validate actionRendered
  }

  return {
    type: 'button',
    flex,
    margin,
    height,
    style,
    color,
    gravity,
    action: actionRendered[0].value,
  };
};

annotateNative(FlexButton, LINE_NAITVE_TYPE);

const FILLER_TYPE = { type: 'filler' };

export const FlexFiller = () => FILLER_TYPE;
annotateNative(FlexFiller, LINE_NAITVE_TYPE);

export const FlexIcon = ({ url, margin, size, aspectRatio }) => ({
  type: 'icon',
  url,
  margin,
  size,
  aspectRatio,
});
annotateNative(FlexIcon, LINE_NAITVE_TYPE);

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
  const actionRendered = render(action, '.action');
  if (__DEV__) {
    // TODO: validate actionRendered
  }

  return {
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
    action: actionRendered && actionRendered[0].value,
  };
};
annotateNative(FlexImage, LINE_NAITVE_TYPE);

export const FlexSeparator = ({ margin, color }) => ({
  type: 'separator',
  margin,
  color,
});
annotateNative(FlexSeparator, LINE_NAITVE_TYPE);

export const FlexSpacer = ({ size }) => ({
  type: 'spacer',
  size,
});
annotateNative(FlexSpacer, LINE_NAITVE_TYPE);

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
  const actionRendered = render(action, '.action');
  if (__DEV__) {
    // TODO: validate actionRendered
  }

  return {
    type: 'text',
    text: renderTextContent(children, render, '.children'),
    flex,
    margin,
    size,
    align,
    gravity,
    wrap,
    maxLines,
    weight,
    color,
    action: actionRendered && actionRendered[0].value,
  };
};

annotateNative(FlexText, LINE_NAITVE_TYPE);

export const createBlockComponent = section => {
  const name = `Flex${section[0].toUpperCase()}${section.slice(1)}`;
  const wrapper = {
    [name]: (
      { children, backgroundColor, separator, separatorColor },
      render
    ) => {
      const contentRendered = render(children, '.children');
      if (__DEV__) {
        // TODO: validate contentRendered
      }

      return {
        section,
        content: contentRendered[0].value,
        style:
          backgroundColor || separator || separatorColor
            ? {
                backgroundColor,
                separator,
                separatorColor,
              }
            : undefined,
      };
    },
  };

  return annotateNative(wrapper[name], LINE_NAITVE_TYPE);
};

export const FlexHeader = createBlockComponent('header');
export const FlexHero = createBlockComponent('hero');
export const FlexBody = createBlockComponent('header');
export const FlexFooter = createBlockComponent('footer');

export const FlexBubbleContainer = ({ children, rightToLeft }, render) => {
  const bubbleObject = {
    type: 'bubble',
    direction: rightToLeft ? 'rtl' : 'ltr',
  };

  const renderedSections = render(children, '.children');
  if (__DEV__) {
    // TODO: validate renderedSections & section not show up twice
  }

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

  return bubbleObject;
};

annotateNative(FlexBubbleContainer, LINE_NAITVE_TYPE);

export const FlexCarouselContainer = ({ children }, render) => {
  const bubblesRendered = render(children, '.children');
  if (__DEV__) {
    // TODO: validate renderedBubbles
  }

  return {
    type: 'carousel',
    contents: bubblesRendered.map(getValue),
  };
};

annotateNative(FlexCarouselContainer, LINE_NAITVE_TYPE);

export const FlexMessage = ({ children, alt, quickReplies }, render) => {
  const containersRendered = render(children, '.children');
  if (__DEV__) {
    // TODO: validate containersRendered
  }

  return {
    type: 'flex',
    altText: alt,
    contents: containersRendered[0].value,
    renderQuickReplies: renderQuickReplies(quickReplies),
  };
};

annotateNativeRoot(FlexMessage, LINE_NAITVE_TYPE);

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
