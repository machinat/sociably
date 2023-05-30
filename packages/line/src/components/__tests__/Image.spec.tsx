import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Image } from '../Image.js';
import { renderUnitElement } from './utils.js';

it('is a valid component', () => {
  expect(typeof Image).toBe('function');
  expect(isNativeType(<Image originalContentUrl="" previewImageUrl="" />)).toBe(
    true
  );
  expect(Image.$$platform).toBe('line');
});

it('match snapshot', async () => {
  await expect(
    renderUnitElement(
      <Image originalContentUrl="https://..." previewImageUrl="https://..." />
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Image
          originalContentUrl="https://..."
          previewImageUrl="https://..."
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "originalContentUrl": "https://...",
            "previewImageUrl": "https://...",
            "type": "image",
          },
          "type": "message",
        },
      },
    ]
  `);
});
