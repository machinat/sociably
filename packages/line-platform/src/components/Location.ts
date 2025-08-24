/* eslint-disable import/prefer-default-export */
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent.js';
import { LineComponent, MessageSegmentValue } from '../types.js';

/** @category Props */
export type LocationProps = {
  title: string;
  address: string;
  latitude: number;
  longitude: number;
};

/**
 * Location sends a user location message.
 *
 * @category Component
 * @props {@link LocationProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#location-message).
 */
export const Location: LineComponent<
  LocationProps,
  UnitSegment<MessageSegmentValue>
> = makeLineComponent(function Location(node, path) {
  const { title, address, latitude, longitude } = node.props;

  return [
    makeUnitSegment(node, path, {
      type: 'message',
      params: {
        type: 'location',
        title,
        address,
        latitude,
        longitude,
      },
    }),
  ];
});
