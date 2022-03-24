/* eslint-disable import/prefer-default-export */
import { makeUnitSegment, UnitSegment } from '@machinat/core/renderer';
import { makeLineComponent } from '../utils';
import { LineComponent, LineMessageSegmentValue } from '../types';

/**
 * @category Props
 */
export type LocationProps = {
  title: string;
  address: string;
  latitude: number;
  longitude: number;
};

/**
 * Location sends a user location message.
 * @category Component
 * @props {@link LocationProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#location-message).
 */
export const Location: LineComponent<
  LocationProps,
  UnitSegment<LineMessageSegmentValue>
> = makeLineComponent(function Location(node, path) {
  const { title, address, latitude, longitude } = node.props;

  return [
    makeUnitSegment(node, path, {
      type: 'location' as const,
      title,
      address,
      latitude,
      longitude,
    }),
  ];
});
