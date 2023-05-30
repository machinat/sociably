import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { TakeThreadContorl } from '../TakeThreadContorl.js';
import { renderUnitElement } from './utils.js';

it('is valid root Component', () => {
  expect(typeof TakeThreadContorl).toBe('function');
  expect(isNativeType(<TakeThreadContorl />)).toBe(true);
  expect(TakeThreadContorl.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(renderUnitElement(<TakeThreadContorl metadata="my precious" />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <TakeThreadContorl
          metadata="my precious"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/take_thread_control",
          "params": {
            "metadata": "my precious",
          },
          "type": "message",
        },
      },
    ]
  `);
});
