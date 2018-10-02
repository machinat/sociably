import {
  annotateNativeRoot,
  annotateNative,
  getValue,
} from 'machinat-renderer';
import { LINE_NAITVE_TYPE } from '../symbol';
import { renderQuickReplies } from './utils';

export const ButtonTemplate = (
  {
    children,
    defaultAction,
    alt,
    thumbnailImage,
    imageAspectRatio,
    contain,
    backgroundColor,
    title,
    text,
    quickReplies,
  },
  render
) => {
  const actionsRendered = render(children, '.children');
  const defaultActionRendered = render(defaultAction, '.defaultAction');
  if (__DEV__) {
    // TODO: validate defaultActionRendered & actionsRendered
  }

  return {
    type: 'template',
    altText: alt,
    template: {
      type: 'buttons',
      thumbnailImageUrl: thumbnailImage,
      imageAspectRatio,
      imageSize: contain && 'contain',
      imageBackgroundColor: backgroundColor,
      title,
      text,
      defaultAction: defaultActionRendered && defaultActionRendered[0].value,
      actions: actionsRendered.map(getValue),
    },
    quickReplies: renderQuickReplies(quickReplies),
  };
};

annotateNativeRoot(ButtonTemplate, LINE_NAITVE_TYPE);

export const ConfirmTemplate = (
  { children, alt, text, quickReplies },
  render
) => {
  const actionsRendered = render(children, '.children');
  if (__DEV__) {
    // TODO: validate actionsRendered
  }

  return {
    type: 'template',
    altText: alt,
    template: {
      type: 'confirm',
      text,
      actions: actionsRendered.map(getValue),
    },
    quickReplies: renderQuickReplies(quickReplies),
  };
};

annotateNativeRoot(ConfirmTemplate, LINE_NAITVE_TYPE);

export const CarouselItem = (
  { children, defaultAction, thumbnailImage, backgroundColor, title, text },
  render
) => {
  const actionsRendered = render(children, '.children');
  const defaultActionRendered = render(defaultAction, '.defaultAction');
  if (__DEV__) {
    // TODO: validate defaultActionRendered & actionsRendered
  }

  return {
    thumbnailImageUrl: thumbnailImage,
    imageBackgroundColor: backgroundColor,
    title,
    text,
    defaultAction: defaultActionRendered && defaultActionRendered[0].value,
    actions: actionsRendered.map(getValue),
  };
};

annotateNative(CarouselItem, LINE_NAITVE_TYPE);

export const CarouselTemplate = (
  { children, alt, imageAspectRatio, contain, quickReplies },
  render
) => {
  const renderedItems = render(children, '.children');
  if (__DEV__) {
    // TODO: validate renderedItems
  }

  return {
    type: 'template',
    altText: alt,
    template: {
      type: 'carousel',
      imageAspectRatio,
      imageSize: contain && 'contain',
      columns: renderedItems.map(getValue),
    },
    quickReplies: renderQuickReplies(quickReplies),
  };
};

annotateNativeRoot(CarouselTemplate, LINE_NAITVE_TYPE);

export const ImageCarouselItem = ({ url, action }, render) => {
  const actionRendered = render(action, '.action');
  if (__DEV__) {
    // TODO: validate actionRendered
  }

  return {
    imageUrl: url,
    action: actionRendered[0].value,
  };
};

annotateNative(ImageCarouselItem, LINE_NAITVE_TYPE);

export const ImageCarouselTemplate = (
  { children, alt, quickReplies },
  render
) => {
  const renderedItems = render(children, '.children');
  if (__DEV__) {
    // TODO: validate renderedItems
  }

  return {
    type: 'template',
    altText: alt,
    template: {
      type: 'image_carousel',
      columns: renderedItems.map(getValue),
    },
    quickReplies: renderQuickReplies(quickReplies),
  };
};

annotateNativeRoot(ImageCarouselTemplate, LINE_NAITVE_TYPE);
