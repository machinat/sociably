import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget.js';
import { Unlike } from '../Unlike.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<Unlike tweetId="12345" />)).toBe(true);
  expect(Unlike.$$platform).toBe('twitter');
  expect(Unlike.$$name).toBe('Unlike');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<Unlike tweetId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    [
      {
        "node": <Unlike
          tweetId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": {
            "method": "DELETE",
            "params": {},
            "url": "2/users/:id/likes/:tweet_id",
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
      "url": "2/users/67890/likes/12345",
    }
  `);
});
