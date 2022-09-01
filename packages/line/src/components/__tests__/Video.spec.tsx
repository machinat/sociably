import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Video } from '../Video';
import { renderUnitElement } from './utils';

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
          Array [
            Object {
              "node": <Video
                originalContentUrl="https://..."
                previewImageUrl="https://..."
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "params": Object {
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
