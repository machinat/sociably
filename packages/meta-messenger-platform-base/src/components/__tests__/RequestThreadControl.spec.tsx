import Sociably from '@sociably/core';
import { RequestThreadControl as _RequestThreadControl } from '../RequestThreadControl.js';
import { renderUnitElement, makeTestComponent } from './utils.js';

const RequestThreadControl = makeTestComponent(_RequestThreadControl);

it('match snapshot', async () => {
  await expect(
    renderUnitElement(<RequestThreadControl metadata="give me the ring" />),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <RequestThreadControl
          metadata="give me the ring"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/request_thread_control",
          "params": {
            "metadata": "give me the ring",
          },
          "type": "message",
        },
      },
    ]
  `);
});
