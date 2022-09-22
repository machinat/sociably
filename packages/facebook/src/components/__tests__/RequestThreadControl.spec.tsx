import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { RequestThreadControl } from '../RequestThreadControl';
import { renderUnitElement } from './utils';

it('is valid Component', () => {
  expect(typeof RequestThreadControl).toBe('function');
  expect(isNativeType(<RequestThreadControl />)).toBe(true);
  expect(RequestThreadControl.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(
    renderUnitElement(<RequestThreadControl metadata="give me the ring" />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <RequestThreadControl
                metadata="give me the ring"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "apiPath": "me/request_thread_control",
                "params": Object {
                  "metadata": "give me the ring",
                },
                "type": "message",
              },
            },
          ]
        `);
});
