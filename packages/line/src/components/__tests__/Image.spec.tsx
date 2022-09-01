import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Image } from '../Image';
import { renderUnitElement } from './utils';

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
          Array [
            Object {
              "node": <Image
                originalContentUrl="https://..."
                previewImageUrl="https://..."
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "params": Object {
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
