import {
  annotate,
  asNative,
  asUnit,
  valuesOfAssertedType,
} from 'machinat-utility';

import { LINE_NAITVE_TYPE } from '../symbol';
import * as _actionModule from './action';

const actionComponents = Object.values(_actionModule);
const renderActionValues = valuesOfAssertedType(...actionComponents);

export const ButtonTemplate = (
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
  const defaultActionValues = renderActionValues(
    defaultAction,
    render,
    '.defaultAction'
  );

  return [
    {
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
        actions: renderActionValues(children, render, '.children'),
      },
    },
  ];
};

annotate(asNative(LINE_NAITVE_TYPE), asUnit(true))(ButtonTemplate);

export const ConfirmTemplate = ({ children, alt, altText, text }, render) => [
  {
    type: 'template',
    altText: altText || alt,
    template: {
      type: 'confirm',
      text,
      actions: renderActionValues(children, render, '.children'),
    },
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(true))(ConfirmTemplate);

export const CarouselItem = (
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
  const defaultActionValues = renderActionValues(
    defaultAction,
    render,
    '.defaultAction'
  );

  return [
    {
      thumbnailImageUrl: thumbnailImageUrl || imageURL,
      imageBackgroundColor,
      title,
      text,
      defaultAction: defaultActionValues && defaultActionValues[0],
      actions: renderActionValues(children, render, '.children'),
    },
  ];
};

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(CarouselItem);

const renderCarouselItemValues = valuesOfAssertedType(CarouselItem);

export const CarouselTemplate = (
  { children, alt, altText, imageAspectRatio, imageSize },
  render
) => [
  {
    type: 'template',
    altText: altText || alt,
    template: {
      type: 'carousel',
      imageAspectRatio,
      imageSize,
      columns: renderCarouselItemValues(children, render, '.children'),
    },
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(true))(CarouselTemplate);

export const ImageCarouselItem = ({ url, imageUrl, action }, render) => {
  const actionValues = renderActionValues(action, render, '.action');

  return [
    {
      imageUrl: imageUrl || url,
      action: actionValues && actionValues[0],
    },
  ];
};

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(ImageCarouselItem);

const renderImageCarouselItemValues = valuesOfAssertedType(ImageCarouselItem);

export const ImageCarouselTemplate = ({ children, alt, altText }, render) => [
  {
    type: 'template',
    altText: altText || alt,
    template: {
      type: 'image_carousel',
      columns: renderImageCarouselItemValues(children, render, '.children'),
    },
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(true))(ImageCarouselTemplate);
