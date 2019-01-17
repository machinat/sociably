import invariant from 'invariant';
import {
  annotate,
  asNative,
  asUnit,
  valuesOfAssertedType,
} from 'machinat-utility';

import { LINE_NAITVE_TYPE } from '../symbol';

import { URIAction, MessageAction } from './action';

export const Image = ({
  url,
  originalContentUrl,
  previewURL,
  previewImageUrl,
}) => [
  {
    type: 'image',
    originalContentUrl: originalContentUrl || url,
    previewImageUrl: previewImageUrl || previewURL,
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(true))(Image);

export const Sticker = ({ stickerId, packageId }) => [
  {
    type: 'sticker',
    packageId,
    stickerId,
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(true))(Sticker);

const renderImageMapActionValues = valuesOfAssertedType(
  URIAction,
  MessageAction
);

export const ImageMapArea = ({ action, x, y, width, height }, render) => {
  const actionValues = renderImageMapActionValues(action, render, '.action');

  invariant(
    actionValues !== undefined && actionValues.length === 1,
    actionValues
      ? `there should be only 1 "action" in <ImageMapArea/>, got ${
          actionValues.length
        }`
      : `prop "action" of <ImageMapArea/> should not be empty`
  );

  const [actionValue] = actionValues;

  return [
    actionValue.type === 'uri'
      ? {
          type: 'uri',
          label: actionValue.label,
          linkUri: actionValue.uri,
          area: {
            x,
            y,
            width,
            height,
          },
        }
      : {
          type: 'message',
          label: actionValue.label,
          text: actionValue.text,
          area: {
            x,
            y,
            width,
            height,
          },
        },
  ];
};

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(ImageMapArea);

const renderURIActionValues = valuesOfAssertedType(URIAction);

export const ImageMapVideoArea = (
  {
    url,
    originalContentUrl,
    previewURL,
    previewImageUrl,
    x,
    y,
    width,
    height,
    action,
  },
  render
) => {
  const actionValues = renderURIActionValues(action, render, '.action');

  return [
    {
      originalContentUrl: originalContentUrl || url,
      previewImageUrl: previewImageUrl || previewURL,
      area: {
        x,
        y,
        width,
        height,
      },
      externalLink: actionValues && {
        linkUri: actionValues[0].uri,
        label: actionValues[0].label,
      },
    },
  ];
};

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(ImageMapVideoArea);

const renderVideoAreaValues = valuesOfAssertedType(ImageMapVideoArea);
const renderActionAreaValues = valuesOfAssertedType(ImageMapArea);

export const ImageMap = (
  { baseURL, baseUrl, alt, altText, height, children, video },
  render
) => {
  const videoValues = renderVideoAreaValues(video, render, '.video');

  return [
    {
      type: 'imagemap',
      baseUrl: baseUrl || baseURL,
      altText: altText || alt,
      baseSize: {
        width: 1040,
        height,
      },
      actions: renderActionAreaValues(children, render, '.children'),
      video: videoValues && videoValues[0],
    },
  ];
};

annotate(asNative(LINE_NAITVE_TYPE), asUnit(true))(ImageMap);
