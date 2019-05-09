import { valuesOfAssertedType } from 'machinat-utility';

import { asSinglePartComponent, asSingleMessageUnitComponent } from './utils';
import * as _actionModule from './action';

const actionComponents = Object.values(_actionModule);
const getActionValues = valuesOfAssertedType(...actionComponents);

const ButtonTemplate = (
  {
    props: {
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
  },
  render
) => {
  const defaultActionValues = getActionValues(
    render(defaultAction, '.defaultAction')
  );

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
      actions: getActionValues(render(children, '.children')),
    },
  };
};
const __ButtonTemplate = asSingleMessageUnitComponent(ButtonTemplate);

const ConfirmTemplate = (
  { props: { children, alt, altText, text } },
  render
) => ({
  type: 'template',
  altText: altText || alt,
  template: {
    type: 'confirm',
    text,
    actions: getActionValues(render(children, '.children')),
  },
});
const __ConfirmTemplate = asSingleMessageUnitComponent(ConfirmTemplate);

const CarouselItem = (
  {
    props: {
      children,
      defaultAction,
      imageURL,
      thumbnailImageUrl,
      imageBackgroundColor,
      title,
      text,
    },
  },
  render
) => {
  const defaultActionValues = getActionValues(
    render(defaultAction, '.defaultAction')
  );

  return {
    thumbnailImageUrl: thumbnailImageUrl || imageURL,
    imageBackgroundColor,
    title,
    text,
    defaultAction: defaultActionValues && defaultActionValues[0],
    actions: getActionValues(render(children, '.children')),
  };
};
const __CarouselItem = asSinglePartComponent(CarouselItem);

const getCarouselItemValues = valuesOfAssertedType(__CarouselItem);

const CarouselTemplate = (
  { props: { children, alt, altText, imageAspectRatio, imageSize } },
  render
) => ({
  type: 'template',
  altText: altText || alt,
  template: {
    type: 'carousel',
    imageAspectRatio,
    imageSize,
    columns: getCarouselItemValues(render(children, '.children')),
  },
});
const __CarouselTemplate = asSingleMessageUnitComponent(CarouselTemplate);

const ImageCarouselItem = ({ props: { url, imageUrl, action } }, render) => {
  const actionValues = getActionValues(render(action, '.action'));

  return {
    imageUrl: imageUrl || url,
    action: actionValues && actionValues[0],
  };
};

const __ImageCarouselItem = asSinglePartComponent(ImageCarouselItem);

const getImageCarouselItemValues = valuesOfAssertedType(__ImageCarouselItem);

const ImageCarouselTemplate = (
  { props: { children, alt, altText } },
  render
) => ({
  type: 'template',
  altText: altText || alt,
  template: {
    type: 'image_carousel',
    columns: getImageCarouselItemValues(render(children, '.children')),
  },
});
const __ImageCarouselTemplate = asSingleMessageUnitComponent(
  ImageCarouselTemplate
);

export {
  __ButtonTemplate as ButtonTemplate,
  __ConfirmTemplate as ConfirmTemplate,
  __CarouselItem as CarouselItem,
  __CarouselTemplate as CarouselTemplate,
  __ImageCarouselItem as ImageCarouselItem,
  __ImageCarouselTemplate as ImageCarouselTemplate,
};
