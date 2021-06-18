import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils';
import Renderer from '@machinat/core/renderer';
import {
  PassThreadControl,
  RequestThreadControl,
  TakeThreadContorl,
} from '../handoverProtocol';

const renderer = new Renderer('messenger', () => null);

it.each([PassThreadControl, RequestThreadControl, TakeThreadContorl])(
  '%p is valid root Component',
  (ThreadControl) => {
    expect(typeof ThreadControl).toBe('function');
    expect(isNativeType(<ThreadControl />)).toBe(true);
    expect(ThreadControl.$$platform).toBe('messenger');
  }
);

test('PassThreadControl', async () => {
  await expect(
    renderer.render(
      <PassThreadControl targetAppId="Legolas" metadata="you have my bow" />
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
                "metadata": "you have my bow",
                "target_app_id": "Legolas",
                Symbol(api_path.messenger.machinat): "me/pass_thread_control",
              },
            },
          ]
        `);
});

test('RequestThreadControl', async () => {
  await expect(
    renderer.render(<RequestThreadControl metadata="give me the ring" />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <RequestThreadControl
                metadata="give me the ring"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "metadata": "give me the ring",
                Symbol(api_path.messenger.machinat): "me/request_thread_control",
              },
            },
          ]
        `);
});

test('TakeThreadContorl', async () => {
  await expect(renderer.render(<TakeThreadContorl metadata="my precious" />))
    .resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <TakeThreadContorl
                metadata="my precious"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "metadata": "my precious",
                Symbol(api_path.messenger.machinat): "me/take_thread_control",
              },
            },
          ]
        `);
});
