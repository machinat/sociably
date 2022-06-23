import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import TwitterChat from '../Chat';
import makeTwitterComponent from '../utils/makeTwitterComponent';
import { TwitterSegmentValue, TwitterComponent } from '../types';

export type MarkReadProps = {
  /** The message ID of the most recent message to be marked read. All messages before it will be marked read as well */
  messageId: string;
};

/**
 * Mark messages as read in the direct message chat
 * @category Component
 * @props {@link MarkReadProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/v1/direct-messages/message-attachments/guides/attaching-location).
 */
export const MarkRead: TwitterComponent<
  MarkReadProps,
  UnitSegment<TwitterSegmentValue>
> = makeTwitterComponent(function MarkRead(node, path) {
  return [
    makeUnitSegment(node, path, {
      type: 'dm',
      request: {
        method: 'POST',
        href: '1.1/direct_messages/mark_read.json',
        parameters: {
          recipient_id: '',
          last_read_event_id: node.props.messageId,
        },
      },
      accomplishRequest: (chat: TwitterChat, request) => {
        // eslint-disable-next-line no-param-reassign
        request.parameters.recipient_id = chat.id;
        return request;
      },
      mediaSources: null,
    }),
  ];
});
