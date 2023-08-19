import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppSegmentValue, WhatsAppComponent } from '../types.js';

export type LocationProps = {
  /** Longitude of the location. */
  longitude: number;
  /** Latitude of the location. */
  latitude: number;
  /** Name of the location. */
  name?: string;
  /** Address of the location. Only displayed if name is present. */
  address?: string;
  /** Reply to the specified message */
  replyTo?: string;
};

/**
 * Send a location
 * @category Component
 * @props {@link LocationProps}
 */
export const Location: WhatsAppComponent<
  LocationProps,
  UnitSegment<WhatsAppSegmentValue>
> = makeWhatsAppComponent(function Location(node, path) {
  const { latitude, longitude, name, address, replyTo } = node.props;

  return [
    makeUnitSegment(node, path, {
      message: {
        type: 'location',
        location: { latitude, longitude, name, address },
        context: replyTo ? { message_id: replyTo } : undefined,
      },
    }),
  ];
});
