import valuesOfAssertedTypes from '@machinat/core/utils/valuesOfAssertedTypes';

import { asPartComponent, asUnitComponent } from '../utils';
import * as actionModule from './action';

const getActionValues = valuesOfAssertedTypes(() => [
  ...Object.values(actionModule),
]);

const ButtonTemplate = async (
  {
    children,
    defaultAction,
    alt,
    altText,
    imageURL,
    thumbnailImageUrl,
    imageAspectRatio,
    imageSize,
    imageBackgroundColor,
    title,
    text,
  },
  render
) => {
  const defaultActionSegments = await render(defaultAction, '.defaultAction');
  const defaultActionValues = getActionValues(defaultActionSegments);

  const actionSegments = await render(children, '.children');

  return {
    type: 'template',
    altText: altText || alt,
    template: {
      type: 'buttons',
      thumbnailImageUrl: thumbnailImageUrl || imageURL,
      imageAspectRatio,
      imageSize,
      imageBackgroundColor,
      title,
      text,
      defaultAction: defaultActionValues && defaultActionValues[0],
      actions: getActionValues(actionSegments),
    },
  };
};
const __ButtonTemplate = asUnitComponent(ButtonTemplate);

const ConfirmTemplate = async ({ children, alt, altText, text }, render) => {
  const actionSegments = await render(children, '.children');

  return {
    type: 'template',
    altText: altText || alt,
    template: {
      type: 'confirm',
      text,
      actions: getActionValues(actionSegments),
    },
  };
};
const __ConfirmTemplate = asUnitComponent(ConfirmTemplate);

const CarouselItem = async (
  {
    children,
    defaultAction,
    imageURL,
    thumbnailImageUrl,
    imageBackgroundColor,
    title,
    text,
  },
  render
) => {
  const defaultActionSegments = await render(defaultAction, '.defaultAction');
  const defaultActionValues = getActionValues(defaultActionSegments);

  const actionSegments = await render(children, '.children');

  return {
    thumbnailImageUrl: thumbnailImageUrl || imageURL,
    imageBackgroundColor,
    title,
    text,
    defaultAction: defaultActionValues && defaultActionValues[0],
    actions: getActionValues(actionSegments),
  };
};
const __CarouselItem = asPartComponent(CarouselItem);

const getCarouselItemValues = valuesOfAssertedTypes(() => [__CarouselItem]);

const CarouselTemplate = async (
  { children, alt, altText, imageAspectRatio, imageSize },
  render
) => {
  const columnSegments = await render(children, '.children');

  return {
    type: 'template',
    altText: altText || alt,
    template: {
      type: 'carousel',
      imageAspectRatio,
      imageSize,
      columns: getCarouselItemValues(columnSegments),
    },
  };
};
const __CarouselTemplate = asUnitComponent(CarouselTemplate);

const ImageCarouselItem = async ({ url, imageUrl, action }, render) => {
  const actionSegments = await render(action, '.action');
  const actionValues = getActionValues(actionSegments);

  return {
    imageUrl: imageUrl || url,
    action: actionValues && actionValues[0],
  };
};

const __ImageCarouselItem = asPartComponent(ImageCarouselItem);

const getImageCarouselItemValues = valuesOfAssertedTypes(() => [
  __ImageCarouselItem,
]);

const ImageCarouselTemplate = async ({ children, alt, altText }, render) => {
  const columnSegments = await render(children, '.children');

  return {
    type: 'template',
    altText: altText || alt,
    template: {
      type: 'image_carousel',
      columns: getImageCarouselItemValues(columnSegments),
    },
  };
};
const __ImageCarouselTemplate = asUnitComponent(ImageCarouselTemplate);

export {
  __ButtonTemplate as ButtonTemplate,
  __ConfirmTemplate as ConfirmTemplate,
  __CarouselItem as CarouselItem,
  __CarouselTemplate as CarouselTemplate,
  __ImageCarouselItem as ImageCarouselItem,
  __ImageCarouselTemplate as ImageCarouselTemplate,
};
