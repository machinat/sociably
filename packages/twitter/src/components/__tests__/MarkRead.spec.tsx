import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TwitterChat from '../../Chat.js';
import { MarkRead } from '../MarkRead.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<MarkRead messageId="12345" />)).toBe(true);
  expect(MarkRead.$$platform).toBe('twitter');
  expect(MarkRead.$$name).toBe('MarkRead');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<MarkRead messageId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    [
      {
        "node": <MarkRead
          messageId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": {
            "method": "POST",
            "params": {
              "last_read_event_id": "12345",
              "recipient_id": "",
            },
            "url": "1.1/direct_messages/mark_read.json",
          },
          "type": "dm",
        },
      },
    ]
  `);
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TwitterChat('12345', '67890'), request, null))
    .toMatchInlineSnapshot(`
    {
      "method": "POST",
      "params": {
        "last_read_event_id": "12345",
        "recipient_id": "67890",
      },
      "url": "1.1/direct_messages/mark_read.json",
    }
  `);
});
