import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget.js';
import { Unmute } from '../Unmute.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<Unmute userId="12345" />)).toBe(true);
  expect(Unmute.$$platform).toBe('twitter');
  expect(Unmute.$$name).toBe('Unmute');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<Unmute userId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    [
      {
        "node": <Unmute
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
            "url": "2/users/:source_user_id/muting/:target_user_id",
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
      "url": "2/users/67890/muting/12345",
    }
  `);
});
