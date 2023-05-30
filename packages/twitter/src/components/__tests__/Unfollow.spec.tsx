import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget.js';
import { Unfollow } from '../Unfollow.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(typeof Unfollow).toBe('function');
  expect(isNativeType(<Unfollow userId="12345" />)).toBe(true);
  expect(Unfollow.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<Unfollow userId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    [
      {
        "node": <Unfollow
          userId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": {
            "method": "DELETE",
            "params": {},
            "url": "2/users/:source_user_id/following/:target_user_id",
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
      "method": "DELETE",
      "params": {},
      "url": "2/users/67890/following/12345",
    }
  `);
});
