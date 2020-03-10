import invariant from 'invariant';
import joinTextualSegments from '@machinat/core/utils/joinTextualSegments';
import valuesOfAssertedTypes from '@machinat/core/utils/valuesOfAssertedTypes';

import { asPartComponent, asUnitComponent } from '../utils';
import * as actionsModule from './action';

const getActionValues = valuesOfAssertedTypes(() => [
  ...Object.values(actionsModule),
]);

const FlexButton = async (
  { action, flex, margin, height, style, color, gravity },
  render
) => {
  const actionSegments = await render(action, '.action');
  const actionValues = getActionValues(actionSegments);

  invariant(
    actionValues !== undefined && actionValues.length === 1,
    `there should be exactly 1 action in prop "action" of FlexButton, got ${
      actionValues ? actionValues.length : 0
    }`
  );

  return {
    type: 'button',
    flex,
    margin,
    height,
    style,
    color,
    gravity,
    action: actionValues[0],
  };
};
const __FlexButton = asPartComponent(FlexButton);

const FILLER_TYPE_VLUES = { type: 'filler' };
const FlexFiller = async () => FILLER_TYPE_VLUES;
const __FlexFiller = asPartComponent(FlexFiller);

const FlexIcon = ({ url, margin, size, aspectRatio }) => ({
  type: 'icon',
  url,
  margin,
  size,
  aspectRatio,
});
const __FlexIcon = asPartComponent(FlexIcon);

const FlexImage = async (
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
  const actionSegments = await render(action, '.action');
  const actionValues = getActionValues(actionSegments);

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
    action: actionValues && actionValues[0],
  };
};
const __FlexImage = asPartComponent(FlexImage);

const FlexSeparator = ({ margin, color }) => ({
  type: 'separator',
  margin,
  color,
});
const __FlexSeparator = asPartComponent(FlexSeparator);

const FlexSpacer = async ({ size }) => ({
  type: 'spacer',
  size,
});
const __FlexSpacer = asPartComponent(FlexSpacer);

const FlexText = async (
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
  const textSegments = await render(children, '.children');
  const joinedSegments = joinTextualSegments(textSegments);

  let text;
  invariant(
    joinedSegments !== null &&
      joinedSegments.length === 1 &&
      typeof (text = joinedSegments[0].value) === 'string', // eslint-disable-line prefer-destructuring
    joinedSegments
      ? `there should be no <br/> in children of <FlexText/>`
      : `children of <FlexText/> should not be empty`
  );

  const actionSegments = await render(action, '.action');
  const actionsValue = getActionValues(actionSegments);

  return {
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
    action: actionsValue && actionsValue[0],
  };
};
const __FlexText = asPartComponent(FlexText);

let getBoxContentValue;

const FlexBox = async (
  { children, layout, flex, spacing, margin, action },
  render
) => {
  const contentSegments = await render(children, '.children');
  const contentValues = getBoxContentValue(contentSegments);

  const actionSegments = await render(action, '.action');
  const actionValues = getActionValues(actionSegments);

  invariant(
    contentValues !== undefined,
    `children of FlexBox should not be empty`
  );

  return {
    type: 'box',
    layout,
    flex,
    spacing,
    margin,
    action: actionValues && actionValues[0],
    contents: contentValues,
  };
};
const __FlexBox = asPartComponent(FlexBox);

getBoxContentValue = valuesOfAssertedTypes(() => [
  __FlexBox,
  __FlexButton,
  __FlexFiller,
  __FlexIcon,
  __FlexImage,
  __FlexSeparator,
  __FlexSpacer,
  __FlexText,
]);

const createBlockComponent = (section, valueFetcher) => {
  const tagName = `Flex${section[0].toUpperCase()}${section.slice(1)}`;

  const wrapper = {
    [tagName]: async (
      { children, backgroundColor, separator, separatorColor },
      render
    ) => {
      const contentSegments = await render(children, '.children');
      const contentValues = valueFetcher(contentSegments);

      invariant(
        contentValues !== undefined && contentValues.length === 1,
        `there should be exactly 1 child in ${tagName}, got ${
          contentValues ? contentValues.length : 0
        }`
      );

      return {
        name: section,
        content: contentValues[0],
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

  return asPartComponent(wrapper[tagName]);
};

const getBoxValues = valuesOfAssertedTypes(() => [__FlexBox]);
const getImagesValues = valuesOfAssertedTypes(() => [__FlexImage]);

const __FlexHeader = createBlockComponent('header', getBoxValues);
const __FlexHero = createBlockComponent('hero', getImagesValues);
const __FlexBody = createBlockComponent('body', getBoxValues);
const __FlexFooter = createBlockComponent('footer', getBoxValues);

const getBlockValues = valuesOfAssertedTypes(() => [
  __FlexHeader,
  __FlexHero,
  __FlexBody,
  __FlexFooter,
]);

const FlexBubbleContainer = async ({ children, rightToLeft }, render) => {
  const bubbleObject = {
    type: 'bubble',
    direction: rightToLeft ? 'rtl' : 'ltr',
  };

  const sectionSegments = await render(children, '.children');
  const sections = getBlockValues(sectionSegments);

  invariant(
    sections !== undefined,
    `there should be at least 1 block in children of <FlexBubbleContainer />`
  );

  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];

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
const __FlexBubbleContainer = asPartComponent(FlexBubbleContainer);

const getBubbleContainerValues = valuesOfAssertedTypes(() => [
  __FlexBubbleContainer,
]);

const FlexCarouselContainer = async ({ children }, render) => {
  const contentSegments = await render(children, '.children');

  return {
    type: 'carousel',
    contents: getBubbleContainerValues(contentSegments),
  };
};
const __FlexCarouselContainer = asPartComponent(FlexCarouselContainer);

const getContainerValues = valuesOfAssertedTypes(() => [
  __FlexBubbleContainer,
  __FlexCarouselContainer,
]);

const FlexMessage = async ({ children, alt, altText }, render) => {
  const contentSegments = await render(children, '.children');
  const contentValues = getContainerValues(contentSegments);

  invariant(
    contentValues !== undefined && contentValues.length === 1,
    `there should be exactly 1 conatiner in children of FlexMessage, got ${
      contentValues ? contentValues.length : 0
    }`
  );

  return {
    type: 'flex',
    altText: altText || alt,
    contents: contentValues[0],
  };
};
const __FlexMessage = asUnitComponent(FlexMessage);

export default {
  Box: __FlexBox,
  Button: __FlexButton,
  Filler: __FlexFiller,
  Icon: __FlexIcon,
  Image: __FlexImage,
  Separator: __FlexSeparator,
  Spacer: __FlexSpacer,
  Text: __FlexText,
  Header: __FlexHeader,
  Hero: __FlexHero,
  Body: __FlexBody,
  Footer: __FlexFooter,
  BubbleContainer: __FlexBubbleContainer,
  CarouselContainer: __FlexCarouselContainer,
  Message: __FlexMessage,
};

export {
  __FlexBox as FlexBox,
  __FlexButton as FlexButton,
  __FlexFiller as FlexFiller,
  __FlexIcon as FlexIcon,
  __FlexImage as FlexImage,
  __FlexSeparator as FlexSeparator,
  __FlexSpacer as FlexSpacer,
  __FlexText as FlexText,
  __FlexHeader as FlexHeader,
  __FlexHero as FlexHero,
  __FlexBody as FlexBody,
  __FlexFooter as FlexFooter,
  __FlexBubbleContainer as FlexBubbleContainer,
  __FlexCarouselContainer as FlexCarouselContainer,
  __FlexMessage as FlexMessage,
};
