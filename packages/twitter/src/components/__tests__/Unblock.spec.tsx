import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget.js';
import { Unblock } from '../Unblock.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(typeof Unblock).toBe('function');
  expect(isNativeType(<Unblock userId="12345" />)).toBe(true);
  expect(Unblock.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<Unblock userId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    [
      {
        "node": <Unblock
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
            "url": "2/users/:source_user_id/blocking/:target_user_id",
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
      "url": "2/users/67890/blocking/12345",
    }
  `);
});
