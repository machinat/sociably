import invariant from 'invariant';
import { valuesOfAssertedType } from 'machinat-utility';

import { asSinglePartComponent, asSingleMessageUnitComponent } from './utils';
import { URIAction, MessageAction } from './action';

const Image = async ({
  props: { url, originalContentUrl, previewURL, previewImageUrl },
}) => ({
  type: 'image',
  originalContentUrl: originalContentUrl || url,
  previewImageUrl: previewImageUrl || previewURL,
});
const __Image = asSingleMessageUnitComponent(Image);

const Sticker = async ({ props: { stickerId, packageId } }) => ({
  type: 'sticker',
  packageId,
  stickerId,
});
const __Sticker = asSingleMessageUnitComponent(Sticker);

const getImageMapActionValues = valuesOfAssertedType(URIAction, MessageAction);

const ImageMapArea = async (
  { props: { action, x, y, width, height } },
  render
) => {
  const actionSegments = await render(action, '.action');
  const actionValues = getImageMapActionValues(actionSegments);

  invariant(
    actionValues !== undefined && actionValues.length === 1,
    actionValues
      ? `there should be only 1 "action" in <ImageMapArea/>, got ${
          actionValues.length
        }`
      : `prop "action" of <ImageMapArea/> should not be empty`
  );

  const [actionValue] = actionValues;

  return actionValue.type === 'uri'
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
      };
};
const __ImageMapArea = asSinglePartComponent(ImageMapArea);

const getURIActionValues = valuesOfAssertedType(URIAction);

const ImageMapVideoArea = async (
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
  const actionSegments = await render(action, '.action');
  const actionValues = getURIActionValues(actionSegments);

  return {
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
  };
};
const __ImageMapVideoArea = asSinglePartComponent(ImageMapVideoArea);

const getVideoAreaValues = valuesOfAssertedType(__ImageMapVideoArea);
const getActionAreaValues = valuesOfAssertedType(__ImageMapArea);

const ImageMap = async (
  { props: { baseURL, baseUrl, alt, altText, height, children, video } },
  render
) => {
  const videoSegments = await render(video, '.video');
  const videoValues = getVideoAreaValues(videoSegments);

  const actionSegments = await render(children, '.children');

  return {
    type: 'imagemap',
    baseUrl: baseUrl || baseURL,
    altText: altText || alt,
    baseSize: {
      width: 1040,
      height,
    },
    actions: getActionAreaValues(actionSegments),
    video: videoValues && videoValues[0],
  };
};
const __ImageMap = asSingleMessageUnitComponent(ImageMap);

export {
  __Image as Image,
  __Sticker as Sticker,
  __ImageMapArea as ImageMapArea,
  __ImageMapVideoArea as ImageMapVideoArea,
  __ImageMap as ImageMap,
};
