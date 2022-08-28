import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget';
import { Unfollow } from '../Unfollow';
import { renderUnitElement } from './utils';

it('is a valid Component', () => {
  expect(typeof Unfollow).toBe('function');
  expect(isNativeType(<Unfollow userId="12345" />)).toBe(true);
  expect(Unfollow.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<Unfollow userId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Unfollow
          userId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": Object {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": Object {
            "href": "2/users/:source_user_id/following/:target_user_id",
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
      "href": "2/users/67890/following/12345",
      "method": "DELETE",
      "parameters": null,
    }
  `);
});
