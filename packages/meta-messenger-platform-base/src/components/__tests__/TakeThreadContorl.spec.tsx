import Sociably from '@sociably/core';
import { TakeThreadContorl as _TakeThreadContorl } from '../TakeThreadContorl.js';
import { renderUnitElement, makeTestComponent } from './utils.js';

const TakeThreadContorl = makeTestComponent(_TakeThreadContorl);

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
