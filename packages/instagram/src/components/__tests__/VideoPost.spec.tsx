import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { VideoPost } from '../VideoPost.js';
import { renderUnitElement } from './utils.js';

it('is valid root Component', () => {
  expect(isNativeType(<VideoPost url="..." />)).toBe(true);
  expect(VideoPost.$$platform).toBe('instagram');
  expect(VideoPost.$$name).toBe('VideoPost');
});

it('match snapshot', async () => {
  await expect(renderUnitElement(<VideoPost url="http://abc.com/..." />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <VideoPost
          url="http://abc.com/..."
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "caption": undefined,
            "location_id": undefined,
            "media_type": "VIDEO",
            "product_tags": undefined,
            "thumb_offset": undefined,
            "user_tags": undefined,
            "video_url": "http://abc.com/...",
          },
          "type": "post",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <VideoPost
        url="https://xyz.com/..."
        caption="Hello #WORLD with @johndoe"
        locationId="1234567890"
        thumbOffset={0.555}
        productTags={[{ productId: '1111111111' }, { productId: '2222222222' }]}
        userTags={[
          { usernames: ['@johndoe', '@janedoe'] },
          { usernames: ['@jojodoe'] },
        ]}
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <VideoPost
          caption="Hello #WORLD with @johndoe"
          locationId="1234567890"
          productTags={
            [
              {
                "productId": "1111111111",
              },
              {
                "productId": "2222222222",
              },
            ]
          }
          thumbOffset={0.555}
          url="https://xyz.com/..."
          userTags={
            [
              {
                "usernames": [
                  "@johndoe",
                  "@janedoe",
                ],
              },
              {
                "usernames": [
                  "@jojodoe",
                ],
              },
            ]
          }
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "caption": "Hello #WORLD with @johndoe",
            "location_id": "1234567890",
            "media_type": "VIDEO",
            "product_tags": [
              {
                "productId": "1111111111",
              },
              {
                "productId": "2222222222",
              },
            ],
            "thumb_offset": 0.555,
            "user_tags": [
              {
                "usernames": [
                  "@johndoe",
                  "@janedoe",
                ],
              },
              {
                "usernames": [
                  "@jojodoe",
                ],
              },
            ],
            "video_url": "https://xyz.com/...",
          },
          "type": "post",
        },
      },
    ]
  `);
});
