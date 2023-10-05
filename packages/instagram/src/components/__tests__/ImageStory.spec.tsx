import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { ImageStory } from '../ImageStory.js';
import { renderUnitElement } from './utils.js';

it('is valid root Component', () => {
  expect(isNativeType(<ImageStory url="..." />)).toBe(true);
  expect(ImageStory.$$platform).toBe('instagram');
  expect(ImageStory.$$name).toBe('ImageStory');
});

it('match snapshot', async () => {
  await expect(renderUnitElement(<ImageStory url="http://abc.com/..." />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ImageStory
          url="http://abc.com/..."
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "caption": undefined,
            "image_url": "http://abc.com/...",
            "location_id": undefined,
            "media_type": "STORIES",
          },
          "type": "post",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <ImageStory
        url="https://xyz.com/..."
        caption="Hello #WORLD with @johndoe"
        locationId="1234567890"
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ImageStory
          caption="Hello #WORLD with @johndoe"
          locationId="1234567890"
          url="https://xyz.com/..."
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "caption": "Hello #WORLD with @johndoe",
            "image_url": "https://xyz.com/...",
            "location_id": "1234567890",
            "media_type": "STORIES",
          },
          "type": "post",
        },
      },
    ]
  `);
});
