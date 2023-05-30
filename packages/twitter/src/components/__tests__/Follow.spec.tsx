import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget.js';
import { Follow } from '../Follow.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(typeof Follow).toBe('function');
  expect(isNativeType(<Follow userId="12345" />)).toBe(true);
  expect(Follow.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<Follow userId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    [
      {
        "node": <Follow
          userId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": {
            "method": "POST",
            "params": {
              "target_user_id": "12345",
            },
            "url": "2/users/:id/following",
          },
          "type": "action",
        },
      },
    ]
  `);
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TweetTarget('67890'), request, null))
    .toMatchInlineSnapshot(`
    {
      "method": "POST",
      "params": {
        "target_user_id": "12345",
      },
      "url": "2/users/67890/following",
    }
  `);
});
