import invariant from 'invariant';
import { joinTextualSegments, valuesOfAssertedType } from 'machinat-utility';

import { asSinglePartComponent, asSingleMessageUnitComponent } from './utils';
import * as actionsModule from './action';

const getActionValues = valuesOfAssertedType(...Object.values(actionsModule));

const FlexButton = (
  { props: { action, flex, margin, height, style, color, gravity } },
  render
) => {
  const actionValues = getActionValues(render(action, '.action'));

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
const __FlexButton = asSinglePartComponent(FlexButton);

const FILLER_TYPE_VLUES = { type: 'filler' };
const FlexFiller = () => FILLER_TYPE_VLUES;
const __FlexFiller = asSinglePartComponent(FlexFiller);

const FlexIcon = ({ props: { url, margin, size, aspectRatio } }) => ({
  type: 'icon',
  url,
  margin,
  size,
  aspectRatio,
});
const __FlexIcon = asSinglePartComponent(FlexIcon);

const FlexImage = (
  {
    props: {
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
  },
  render
) => {
  const actionValues = getActionValues(render(action, '.action'));

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
const __FlexImage = asSinglePartComponent(FlexImage);

const FlexSeparator = ({ props: { margin, color } }) => ({
  type: 'separator',
  margin,
  color,
});
const __FlexSeparator = asSinglePartComponent(FlexSeparator);

const FlexSpacer = ({ props: { size } }) => ({
  type: 'spacer',
  size,
});
const __FlexSpacer = asSinglePartComponent(FlexSpacer);

const FlexText = (
  {
    props: {
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
  },
  render
) => {
  const textSegments = joinTextualSegments(render(children, '.children'));

  let text;
  invariant(
    textSegments !== null &&
      textSegments.length === 1 &&
      typeof (text = textSegments[0].value) === 'string', // eslint-disable-line prefer-destructuring
    textSegments
      ? `there should be no <br/> in children of <FlexText/>`
      : `children of <FlexText/> should not be empty`
  );

  const actionsValue = getActionValues(render(action, '.action'));

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
const __FlexText = asSinglePartComponent(FlexText);

let getBoxContentValue;

const FlexBox = (
  { props: { children, layout, flex, spacing, margin, action } },
  render
) => {
  const contentValues = getBoxContentValue(render(children, '.children'));
  const actionValues = getActionValues(render(action, '.action'));

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
const __FlexBox = asSinglePartComponent(FlexBox);

getBoxContentValue = valuesOfAssertedType(
  __FlexBox,
  __FlexButton,
  __FlexFiller,
  __FlexIcon,
  __FlexImage,
  __FlexSeparator,
  __FlexSpacer,
  __FlexText
);

const createBlockComponent = (section, valueFetcher) => {
  const tagName = `Flex${section[0].toUpperCase()}${section.slice(1)}`;

  const wrapper = {
    [tagName]: (
      { props: { children, backgroundColor, separator, separatorColor } },
      render
    ) => {
      const contentValues = valueFetcher(render(children, '.children'));

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

  return asSinglePartComponent(wrapper[tagName]);
};

const getBoxValues = valuesOfAssertedType(__FlexBox);
const getImagesValues = valuesOfAssertedType(__FlexImage);

const __FlexHeader = createBlockComponent('header', getBoxValues);
const __FlexHero = createBlockComponent('hero', getImagesValues);
const __FlexBody = createBlockComponent('body', getBoxValues);
const __FlexFooter = createBlockComponent('footer', getBoxValues);

const getBlockValues = valuesOfAssertedType(
  __FlexHeader,
  __FlexHero,
  __FlexBody,
  __FlexFooter
);

const FlexBubbleContainer = ({ props: { children, rightToLeft } }, render) => {
  const bubbleObject = {
    type: 'bubble',
    direction: rightToLeft ? 'rtl' : 'ltr',
  };

  const sections = getBlockValues(render(children, '.children'));

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
const __FlexBubbleContainer = asSinglePartComponent(FlexBubbleContainer);

const getBubbleContainerValues = valuesOfAssertedType(__FlexBubbleContainer);

const FlexCarouselContainer = ({ props: { children } }, render) => ({
  type: 'carousel',
  contents: getBubbleContainerValues(render(children, '.children')),
});
const __FlexCarouselContainer = asSinglePartComponent(FlexCarouselContainer);

const getContainerValues = valuesOfAssertedType(
  __FlexBubbleContainer,
  __FlexCarouselContainer
);

const FlexMessage = ({ props: { children, alt, altText } }, render) => {
  const containerValues = getContainerValues(render(children, '.children'));

  invariant(
    containerValues !== undefined && containerValues.length === 1,
    `there should be exactly 1 conatiner in children of FlexMessage, got ${
      containerValues ? containerValues.length : 0
    }`
  );

  return {
    type: 'flex',
    altText: altText || alt,
    contents: containerValues[0],
  };
};
const __FlexMessage = asSingleMessageUnitComponent(FlexMessage);

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
