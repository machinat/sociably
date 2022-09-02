import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import {
  PassThreadControl,
  RequestThreadControl,
  TakeThreadContorl,
} from '../handoverProtocol';
import { renderUnitElement } from './utils';

it.each([PassThreadControl, RequestThreadControl, TakeThreadContorl])(
  '%p is valid root Component',
  (ThreadControl) => {
    expect(typeof ThreadControl).toBe('function');
    expect(isNativeType(<ThreadControl />)).toBe(true);
    expect(ThreadControl.$$platform).toBe('facebook');
  }
);

test('PassThreadControl', async () => {
  await expect(
    renderUnitElement(
      <PassThreadControl
        targetAppId={'Legolas' as never}
        metadata="you have my bow"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <PassThreadControl
                metadata="you have my bow"
                targetAppId="Legolas"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "apiPath": "me/pass_thread_control",
                "params": Object {
                  "metadata": "you have my bow",
                  "target_app_id": "Legolas",
                },
              },
            },
          ]
        `);
});

test('RequestThreadControl', async () => {
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
              },
            },
          ]
        `);
});

test('TakeThreadContorl', async () => {
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
              },
            },
          ]
        `);
});
