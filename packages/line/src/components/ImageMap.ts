import { SociablyNode } from '@sociably/core';
import {
  makeUnitSegment,
  makePartSegment,
  UnitSegment,
  PartSegment,
} from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent.js';
import {
  LineComponent,
  MessageSegmentValue,
  ImagemapMessageParams,
} from '../types.js';

/**
 * @category Props
 */
export type ImageMapAreaProps = {
  /**
   * An {@link UriAction} or {@link MessageAction} element to be triggered when
   * the area is touched.
   */
  action: SociablyNode;
  /**
   * Horizontal position relative to the left edge of the area. Value must be 0
   * or higher.
   */
  x: number;
  /**
   * Vertical position relative to the top of the area. Value must be 0 or
   * higher.
   */
  y: number;
  /** Width of the tappable area. */
  width: number;
  /** Height of the tappable area. */
  height: number;
};

/**
 * ImageMapArea specifies the actions and tappable areas of an imagemap.
 * @category Component
 * @props {@link ImageMapAreaProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#imagemap-action-objects).
 */
export const ImageMapArea: LineComponent<
  ImageMapAreaProps,
  PartSegment<{}>
> = makeLineComponent(async function ImageMapArea(node, path, render) {
  const { action, x, y, width, height } = node.props;
  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value as Record<string, string>;

  return [
    makePartSegment(
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
});

/**
 * @category Props
 */
export type ImageMapVideoAreaProps = {
  /** URL of the video file (Max character limit: 1000) */
  originalContentUrl: string;
  /** URL of the preview image (Max character limit: 1000) */
  previewImageUrl: string;
  /**
   * Horizontal position of the video area relative to the left edge of the
   * imagemap area. Value must be 0 or higher.
   */
  x: number;
  /**
   * Vertical position of the video area relative to the top of the imagemap
   * area. Value must be 0 or higher.
   */
  y: number;
  /** Width of the video area */
  width: number;
  /** Height of the video area */
  height: number;
  /** An {@link UriAction} element to be displayed after the video is finished. */
  action?: SociablyNode;
};

/**
 * ImageMapVideoAreaProps play a video on the image and display a label with a
 * hyperlink after the video is finished.
 * @category Component
 * @props {@link ImageMapVideoAreaProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#imagemap-message).
 */
export const ImageMapVideoArea: LineComponent<
  ImageMapVideoAreaProps,
  PartSegment<{}>
> = makeLineComponent(async function ImageMapVideoArea(node, path, render) {
  const { originalContentUrl, previewImageUrl, x, y, width, height, action } =
    node.props;

  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value as Record<string, string>;

  return [
    makePartSegment(node, path, {
      originalContentUrl,
      previewImageUrl,
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
});

/**
 * @category Props
 */
export type ImageMapProps = {
  /** ImageMapArea elements for the actions on touching. */
  children: SociablyNode;
  /** Base URL of the image */
  baseUrl?: string;
  /** Alternative text. */
  altText: string;
  /**
   * Height of base image. Set to the height that corresponds to a width of 1040
   * pixels.
   */
  height: number;
  /** One ImageMapVideoArea element to play video within the image map. */
  video?: SociablyNode;
};

/**
 * Imagemap messages are messages configured with an image that has multiple
 * tappable areas. You can assign one tappable area for the entire image or
 * different tappable areas on divided areas of the image.
 * @category Component
 * @props {@link ImageMapProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#imagemap-message).
 */

export const ImageMap: LineComponent<
  ImageMapProps,
  UnitSegment<MessageSegmentValue>
> = makeLineComponent(async function ImageMap(node, path, render) {
  const { baseUrl, altText, height, children, video } = node.props;

  const videoSegments = await render(video, '.video');
  const videoValue = videoSegments?.[0].value as ImagemapMessageParams['video'];

  const actionSegments = await render(children, '.children');
  const actionValues = actionSegments?.map((segment) => segment.value);

  return [
    makeUnitSegment(node, path, {
      type: 'message',
      params: {
        type: 'imagemap',
        baseUrl,
        altText,
        baseSize: {
          width: 1040,
          height,
        },
        actions: actionValues || [],
        video: videoValue,
      },
    }),
  ];
});
