import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Video } from '../Video.js';
import { renderUnitElement } from './utils.js';

it('is valid native unit component', () => {
  expect(typeof Video).toBe('function');
  expect(isNativeType(<Video {...({} as never)} />)).toBe(true);
  expect(Video.$$platform).toBe('line');
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
