import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget';
import { Mute } from '../Mute';
import { renderUnitElement } from './utils';

it('is a valid Component', () => {
  expect(typeof Mute).toBe('function');
  expect(isNativeType(<Mute userId="12345" />)).toBe(true);
  expect(Mute.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<Mute userId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Mute
          userId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": Object {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": Object {
            "method": "POST",
            "params": Object {
              "target_user_id": "12345",
            },
            "url": "2/users/:id/muting",
          },
          "type": "action",
        },
      },
    ]
  `);
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TweetTarget('67890'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "method": "POST",
      "params": Object {
        "target_user_id": "12345",
      },
      "url": "2/users/67890/muting",
    }
  `);
});
