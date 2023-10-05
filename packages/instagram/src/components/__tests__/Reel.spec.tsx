import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Reel } from '../Reel.js';
import { renderUnitElement } from './utils.js';

it('is valid root Component', () => {
  expect(isNativeType(<Reel url="..." />)).toBe(true);
  expect(Reel.$$platform).toBe('instagram');
  expect(Reel.$$name).toBe('Reel');
});

it('match snapshot', async () => {
  await expect(renderUnitElement(<Reel url="http://abc.com/..." />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <Reel
          url="http://abc.com/..."
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "audio_name": undefined,
            "cover_url": undefined,
            "location_id": undefined,
            "media_type": "REELS",
            "share_to_feed": undefined,
            "thumb_offset": undefined,
            "video_url": "http://abc.com/...",
          },
          "type": "post",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <Reel
        url="https://xyz.com/..."
        audioName="good_song.mp3"
        coverUrl="https://xyz.com/cover.jpg"
        locationId="1234567890"
        shareToFeed
        thumbOffset={0.555}
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Reel
          audioName="good_song.mp3"
          coverUrl="https://xyz.com/cover.jpg"
          locationId="1234567890"
          shareToFeed={true}
          thumbOffset={0.555}
          url="https://xyz.com/..."
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "audio_name": "good_song.mp3",
            "cover_url": "https://xyz.com/cover.jpg",
            "location_id": "1234567890",
            "media_type": "REELS",
            "share_to_feed": true,
            "thumb_offset": 0.555,
            "video_url": "https://xyz.com/...",
          },
          "type": "post",
        },
      },
    ]
  `);
});
