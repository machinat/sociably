import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppSegmentValue, WhatsAppComponent } from '../types.js';

export type ReadProps = {
  /** Longitude of the location. */
  messageId: string;
};

/**
 * Send a location
 *
 * @category Component
 * @props {@link ReadProps}
 */
export const Read: WhatsAppComponent<
  ReadProps,
  UnitSegment<WhatsAppSegmentValue>
> = makeWhatsAppComponent(function Read(node, path) {
  const { messageId } = node.props;

  return [
    makeUnitSegment(node, path, {
      message: {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      },
    }),
  ];
});
