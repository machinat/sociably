import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { ImagePost } from '../ImagePost.js';
import { renderUnitElement } from './utils.js';

it('is valid root Component', () => {
  expect(isNativeType(<ImagePost url="..." />)).toBe(true);
  expect(ImagePost.$$platform).toBe('instagram');
  expect(ImagePost.$$name).toBe('ImagePost');
});

it('match snapshot', async () => {
  await expect(renderUnitElement(<ImagePost url="http://abc.com/..." />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ImagePost
          url="http://abc.com/..."
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "caption": undefined,
            "image_url": "http://abc.com/...",
            "location_id": undefined,
            "product_tags": undefined,
            "user_tags": undefined,
          },
          "type": "post",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <ImagePost
        url="https://xyz.com/..."
        caption="Hello #WORLD with @johndoe"
        locationId="1234567890"
        productTags={[
          { productId: '1111111111' },
          { productId: '2222222222', x: 0.1, y: 0.2 },
        ]}
        userTags={[
          { usernames: ['@johndoe', '@janedoe'] },
          { usernames: ['@jojodoe'], x: 0.3, y: 0.4 },
        ]}
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ImagePost
          caption="Hello #WORLD with @johndoe"
          locationId="1234567890"
          productTags={
            [
              {
                "productId": "1111111111",
              },
              {
                "productId": "2222222222",
                "x": 0.1,
                "y": 0.2,
              },
            ]
          }
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
                "x": 0.3,
                "y": 0.4,
              },
            ]
          }
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "caption": "Hello #WORLD with @johndoe",
            "image_url": "https://xyz.com/...",
            "location_id": "1234567890",
            "product_tags": [
              {
                "productId": "1111111111",
              },
              {
                "productId": "2222222222",
                "x": 0.1,
                "y": 0.2,
              },
            ],
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
                "x": 0.3,
                "y": 0.4,
              },
            ],
          },
          "type": "post",
        },
      },
    ]
  `);
});
