import {
  annotateNativeRoot,
  annotateNative,
  getValue,
} from 'machinat-renderer';
import { LINE_NAITVE_TYPE } from '../symbol';
import { renderQuickReplies } from './utils';

export const Image = ({ url, previewImage, quickReplies }, render) => ({
  type: 'image',
  originalContentUrl: url,
  previewImageUrl: previewImage,
  quickReplies: renderQuickReplies(quickReplies, render),
});

annotateNativeRoot(Image, LINE_NAITVE_TYPE);

export const Sticker = (
  { id: stickerId, package: packageId, quickReplies },
  render
) => ({
  type: 'sticker',
  packageId,
  stickerId,
  quickReplies: renderQuickReplies(quickReplies, render),
});

annotateNativeRoot(Sticker, LINE_NAITVE_TYPE);

export const ImageMapArea = ({ action, x, y, width, height }, render) => {
  const renderedAction = render(action, '.action');
  if (__DEV__) {
    // TODO: validate renderedAction
  }

  const { type, label, uri, text } = renderedAction[0].value;
  return {
    type,
    label,
    linkUri: uri,
    text,
    area: {
      x,
      y,
      width,
      height,
    },
  };
};

annotateNative(ImageMapArea, LINE_NAITVE_TYPE);

export const ImageMap = (
  { baseUrl, alt, height, children, quickReplies },
  render
) => {
  const renderedArea = render(children, '.children');
  if (__DEV__) {
    // TODO: validate renderedArea
  }

  return {
    type: 'imagemap',
    baseUrl,
    altText: alt,
    baseSize: {
      width: 1040,
      height,
    },
    actions: renderedArea.map(getValue),
    quickReplies: renderQuickReplies(quickReplies, render),
  };
};

annotateNativeRoot(ImageMap, LINE_NAITVE_TYPE);
