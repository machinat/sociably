import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { VideoStory } from '../VideoStory.js';
import { renderUnitElement } from './utils.js';

it('is valid root Component', () => {
  expect(isNativeType(<VideoStory url="..." />)).toBe(true);
  expect(VideoStory.$$platform).toBe('instagram');
  expect(VideoStory.$$name).toBe('VideoStory');
});

it('match snapshot', async () => {
  await expect(renderUnitElement(<VideoStory url="http://abc.com/..." />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <VideoStory
          url="http://abc.com/..."
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "caption": undefined,
            "location_id": undefined,
            "media_type": "STORIES",
            "video_url": "http://abc.com/...",
          },
          "type": "post",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <VideoStory
        url="https://xyz.com/..."
        caption="Hello #WORLD with @johndoe"
        locationId="1234567890"
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <VideoStory
          caption="Hello #WORLD with @johndoe"
          locationId="1234567890"
          url="https://xyz.com/..."
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "caption": "Hello #WORLD with @johndoe",
            "location_id": "1234567890",
            "media_type": "STORIES",
            "video_url": "https://xyz.com/...",
          },
          "type": "post",
        },
      },
    ]
  `);
});
