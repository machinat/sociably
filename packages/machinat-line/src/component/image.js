import invariant from 'invariant';
import { valuesOfAssertedType } from 'machinat-utility';

import { asPartComponent, asMessageUnitComponent } from './utils';
import { URIAction, MessageAction } from './action';

const Image = ({
  props: { url, originalContentUrl, previewURL, previewImageUrl },
}) => [
  {
    type: 'image',
    originalContentUrl: originalContentUrl || url,
    previewImageUrl: previewImageUrl || previewURL,
  },
];
const __Image = asMessageUnitComponent(Image);

const Sticker = ({ props: { stickerId, packageId } }) => [
  {
    type: 'sticker',
    packageId,
    stickerId,
  },
];
const __Sticker = asMessageUnitComponent(Sticker);

const getImageMapActionValues = valuesOfAssertedType(URIAction, MessageAction);

const ImageMapArea = ({ props: { action, x, y, width, height } }, render) => {
  const actionValues = getImageMapActionValues(render(action, '.action'));

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
const __ImageMapArea = asPartComponent(ImageMapArea);

const renderURIActionValues = valuesOfAssertedType(URIAction);

const ImageMapVideoArea = (
  {
    props: {
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
  },
  render
) => {
  const actionValues = renderURIActionValues(render(action, '.action'));

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
const __ImageMapVideoArea = asPartComponent(ImageMapVideoArea);

const getVideoAreaValues = valuesOfAssertedType(__ImageMapVideoArea);
const renderActionAreaValues = valuesOfAssertedType(__ImageMapArea);

const ImageMap = (
  { props: { baseURL, baseUrl, alt, altText, height, children, video } },
  render
) => {
  const videoValues = getVideoAreaValues(render(video, '.video'));

  return [
    {
      type: 'imagemap',
      baseUrl: baseUrl || baseURL,
      altText: altText || alt,
      baseSize: {
        width: 1040,
        height,
      },
      actions: renderActionAreaValues(render(children, '.children')),
      video: videoValues && videoValues[0],
    },
  ];
};
const __ImageMap = asMessageUnitComponent(ImageMap);

export {
  __Image as Image,
  __Sticker as Sticker,
  __ImageMapArea as ImageMapArea,
  __ImageMapVideoArea as ImageMapVideoArea,
  __ImageMap as ImageMap,
};
