import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Sticker } from '../Sticker.js';
import { renderUnitElement } from './utils.js';

it('is a valid component', () => {
  expect(isNativeType(<Sticker packageId="" stickerId="" />)).toBe(true);
  expect(Sticker.$$platform).toBe('line');
  expect(Sticker.$$name).toBe('Sticker');
});

it('match snapshot', async () => {
  await expect(renderUnitElement(<Sticker packageId="1" stickerId="2" />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Sticker
          packageId="1"
          stickerId="2"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "packageId": "1",
            "stickerId": "2",
            "type": "sticker",
          },
          "type": "message",
        },
      },
    ]
  `);
});
