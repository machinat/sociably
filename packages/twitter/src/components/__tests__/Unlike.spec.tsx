import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget';
import { Unlike } from '../Unlike';
import { renderUnitElement } from './utils';

it('is a valid Component', () => {
  expect(typeof Unlike).toBe('function');
  expect(isNativeType(<Unlike tweetId="12345" />)).toBe(true);
  expect(Unlike.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<Unlike tweetId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Unlike
          tweetId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": Object {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": Object {
            "href": "2/users/:id/likes/:tweet_id",
            "method": "DELETE",
            "parameters": null,
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
      "href": "2/users/67890/likes/12345",
      "method": "DELETE",
      "parameters": null,
    }
  `);
});
