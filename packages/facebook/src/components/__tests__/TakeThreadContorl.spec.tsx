import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { TakeThreadContorl } from '../TakeThreadContorl';
import { renderUnitElement } from './utils';

it('is valid root Component', () => {
  expect(typeof TakeThreadContorl).toBe('function');
  expect(isNativeType(<TakeThreadContorl />)).toBe(true);
  expect(TakeThreadContorl.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(renderUnitElement(<TakeThreadContorl metadata="my precious" />))
    .resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <TakeThreadContorl
                metadata="my precious"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "apiPath": "me/take_thread_control",
                "params": Object {
                  "metadata": "my precious",
                },
                "type": "message",
              },
            },
          ]
        `);
});
