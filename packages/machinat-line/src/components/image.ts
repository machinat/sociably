import { unitSegment, partSegment } from '@machinat/core/renderer';
import { annotateLineComponent } from '../utils';

export const Image = (node, path) => {
  const { url, originalContentUrl, previewURL, previewImageUrl } = node.props;
  return [
    unitSegment(node, path, {
      type: 'image',
      originalContentUrl: originalContentUrl || url,
      previewImageUrl: previewImageUrl || previewURL,
    }),
  ];
};
annotateLineComponent(Image);

export const Sticker = (node, path) => {
  const { stickerId, packageId } = node.props;
  return [
    unitSegment(node, path, {
      type: 'sticker',
      packageId,
      stickerId,
    }),
  ];
};
annotateLineComponent(Sticker);

export const ImageMapArea = async (node, path, render) => {
  const { action, x, y, width, height } = node.props;
  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value;

  return [
    partSegment(
      node,
      path,
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
          }
    ),
  ];
};
annotateLineComponent(ImageMapArea);

export const ImageMapVideoArea = async (node, path, render) => {
  const {
    url,
    originalContentUrl,
    previewURL,
    previewImageUrl,
    x,
    y,
    width,
    height,
    action,
  } = node.props;

  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value;

  return [
    partSegment(node, path, {
      originalContentUrl: originalContentUrl || url,
      previewImageUrl: previewImageUrl || previewURL,
      area: {
        x,
        y,
        width,
        height,
      },
      externalLink: actionValue && {
        linkUri: actionValue.uri,
        label: actionValue.label,
      },
    }),
  ];
};
annotateLineComponent(ImageMapVideoArea);

export const ImageMap = async (node, path, render) => {
  const { baseURL, baseUrl, altText, height, children, video } = node.props;

  const videoSegments = await render(video, '.video');
  const videoValue = videoSegments?.[0].value;

  const actionSegments = await render(children, '.children');
  const actionValues = actionSegments?.map((segment) => segment.value);

  return [
    unitSegment(node, path, {
      type: 'imagemap',
      baseUrl: baseUrl || baseURL,
      altText,
      baseSize: {
        width: 1040,
        height,
      },
      actions: actionValues,
      video: videoValue,
    }),
  ];
};
annotateLineComponent(ImageMap);
