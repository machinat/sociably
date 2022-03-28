/* eslint-disable import/prefer-default-export */
import { makeUnitSegment, UnitSegment } from '@machinat/core/renderer';
import TwitterChat from '../Chat';
import makeTwitterComponent from '../utils/makeTwitterComponent';
import { TwitterSegmentValue, TwitterComponent } from '../types';

/**
 * Display typing action in the direct message chat
 * @category Component
 * @props {@link TypingProps}
 * @guides Check official [reference](https://developer.twitter.com/en/docs/twitter-api/v1/direct-messages/typing-indicator-and-read-receipts/api-reference/new-typing-indicator).
 */
export const Typing: TwitterComponent<
  {},
  UnitSegment<TwitterSegmentValue>
> = makeTwitterComponent(function Typing(node, path) {
  return [
    makeUnitSegment(node, path, {
      type: 'dm',
      request: {
        method: 'POST',
        href: '1.1/direct_messages/indicate_typing.json',
        parameters: { recipient_id: '' },
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