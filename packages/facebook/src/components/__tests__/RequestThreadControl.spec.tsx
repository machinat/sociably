import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { RequestThreadControl } from '../RequestThreadControl.js';
import { renderUnitElement } from './utils.js';

it('is valid Component', () => {
  expect(typeof RequestThreadControl).toBe('function');
  expect(isNativeType(<RequestThreadControl />)).toBe(true);
  expect(RequestThreadControl.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(
    renderUnitElement(<RequestThreadControl metadata="give me the ring" />)
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
