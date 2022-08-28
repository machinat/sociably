import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent';
import { WhatsAppSegmentValue, WhatsAppComponent } from '../types';

export type ReadProps = {
  /** Longitude of the location. */
  messageId: string;
};

/**
 * Send a location
 * @category Component
 * @props {@link ReadProps}
 */
export const Read: WhatsAppComponent<
  ReadProps,
  UnitSegment<WhatsAppSegmentValue>
> = makeWhatsAppComponent(function ReadProps(node, path) {
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
