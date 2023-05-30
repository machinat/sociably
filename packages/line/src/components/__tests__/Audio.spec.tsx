import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Audio } from '../Audio.js';
import { renderUnitElement } from './utils.js';

it('is valid native unit component', () => {
  expect(typeof Audio).toBe('function');
  expect(isNativeType(<Audio originalContentUrl="" duration={0} />)).toBe(true);
  expect(Audio.$$platform).toBe('line');
});

it('%s render match snapshot', async () => {
  await expect(
    renderUnitElement(
      <Audio originalContentUrl="https://..." duration={6666} />
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Audio
          duration={6666}
          originalContentUrl="https://..."
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "duration": 6666,
            "originalContentUrl": "https://...",
            "type": "audio",
          },
          "type": "message",
        },
      },
    ]
  `);
});
