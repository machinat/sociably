import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TwitterChat from '../../Chat';
import { MarkRead } from '../MarkRead';
import { renderUnitElement } from './utils';

it('is a valid Component', () => {
  expect(typeof MarkRead).toBe('function');
  expect(isNativeType(<MarkRead messageId="12345" />)).toBe(true);
  expect(MarkRead.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<MarkRead messageId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <MarkRead
          messageId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": Object {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": Object {
            "href": "1.1/direct_messages/mark_read.json",
            "method": "POST",
            "parameters": Object {
              "last_read_event_id": "12345",
              "recipient_id": "",
            },
          },
          "type": "dm",
        },
      },
    ]
  `);
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TwitterChat('12345', '67890'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "href": "1.1/direct_messages/mark_read.json",
      "method": "POST",
      "parameters": Object {
        "last_read_event_id": "12345",
        "recipient_id": "67890",
      },
    }
  `);
});
