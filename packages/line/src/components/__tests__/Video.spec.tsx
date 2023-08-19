import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Video, VideoProps } from '../Video.js';
import { renderUnitElement } from './utils.js';

it('is valid native unit component', () => {
  expect(isNativeType(<Video {...({} as VideoProps)} />)).toBe(true);
  expect(Video.$$platform).toBe('line');
  expect(Video.$$name).toBe('Video');
});

it('%s render match snapshot', async () => {
  await expect(
    renderUnitElement(
      <Video originalContentUrl="https://..." previewImageUrl="https://..." />
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Video
          originalContentUrl="https://..."
          previewImageUrl="https://..."
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "originalContentUrl": "https://...",
            "previewImageUrl": "https://...",
            "trackingId": undefined,
            "type": "video",
          },
          "type": "message",
        },
      },
    ]
  `);
});
