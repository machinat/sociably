/* eslint-disable import/prefer-default-export */
import { unitSegment } from '@machinat/core/renderer';
import { UnitSegment } from '@machinat/core/renderer/types';
import { annotateLineComponent } from '../utils';
import { LineComponent, LineMessageSegmentValue } from '../types';

/**
 * @category Props
 */
type LocationProps = {
  title: string;
  address: string;
  latitude: string;
  longitude: string;
};

/** @internal */
const __Location = function Location(node, path) {
  const { title, address, latitude, longitude } = node.props;

  return [
    unitSegment(node, path, {
      type: 'location' as const,
      title,
      address,
      latitude,
      longitude,
    }),
  ];
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
> = annotateLineComponent(__Location);