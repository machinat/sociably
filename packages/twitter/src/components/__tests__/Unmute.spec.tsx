import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget';
import { Unmute } from '../Unmute';
import { renderUnitElement } from './utils';

it('is a valid Component', () => {
  expect(typeof Unmute).toBe('function');
  expect(isNativeType(<Unmute userId="12345" />)).toBe(true);
  expect(Unmute.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<Unmute userId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Unmute
          userId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": Object {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": Object {
            "href": "2/users/:source_user_id/muting/:target_user_id",
            "method": "DELETE",
            "params": Object {},
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
      "href": "2/users/67890/muting/12345",
      "method": "DELETE",
      "params": Object {},
    }
  `);
});
