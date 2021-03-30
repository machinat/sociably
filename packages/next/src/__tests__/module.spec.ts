import moxy, { Moxy } from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import _createNextApp from 'next';
import { NextReceiver } from '../receiver';
import Next from '../module';

const createNextApp = _createNextApp as Moxy<typeof _createNextApp>;

it('exports interfaces', () => {
  expect(Next.Receiver).toBe(NextReceiver);
  expect(Next.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "NextConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(Next.Server).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "NextServer",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

describe('initModule()', () => {
  test('module object', () => {
    expect(
      Next.initModule({
        entryPath: '/webview',
        noPrepare: false,
        serverOptions: { dev: true },
        handleRequest: () => ({ ok: true }),
      })
    ).toMatchInlineSnapshot(`
      Object {
        "provisions": Array [
          [Function],
          Object {
            "provide": Object {
              "$$multi": false,
              "$$name": "NextConfigs",
              "$$polymorphic": false,
              "$$typeof": Symbol(interface.service.machinat),
            },
            "withValue": Object {
              "entryPath": "/webview",
              "handleRequest": [Function],
              "noPrepare": false,
              "serverOptions": Object {
                "dev": true,
              },
            },
          },
          Object {
            "provide": Object {
              "$$multi": false,
              "$$name": "NextServer",
              "$$polymorphic": false,
              "$$typeof": Symbol(interface.service.machinat),
            },
            "withProvider": [Function],
          },
          Object {
            "provide": Object {
              "$$multi": true,
              "$$name": "HttpRequestRouteList",
              "$$polymorphic": false,
              "$$typeof": Symbol(interface.service.machinat),
            },
            "withProvider": [Function],
          },
        ],
        "startHook": [Function],
      }
    `);
  });

  test('provisions', async () => {
    const app = Machinat.createApp({
      modules: [
        Next.initModule({
          entryPath: '/webview',
          noPrepare: false,
          serverOptions: { dev: true },
        }),
      ],
    });
    await app.start();

    const [receiver, nextApp, configs, routings] = app.useServices([
      Next.Receiver,
      Next.Server,
      Next.Configs,
      Http.RequestRouteList,
    ]);

    expect(receiver).toBeInstanceOf(NextReceiver);
    expect(configs).toEqual({
      entryPath: '/webview',
      noPrepare: false,
      serverOptions: { dev: true },
    });

    expect(createNextApp.mock).toHaveBeenCalledTimes(1);
    expect(createNextApp.mock).toHaveBeenCalledWith({ dev: true });
    expect(nextApp).toBe(createNextApp.mock.calls[0].result);

    expect(routings).toMatchInlineSnapshot(`
      Array [
        Object {
          "handler": [Function],
          "name": "next",
          "path": "/webview",
        },
      ]
    `);
  });

  test('startHook() call receiver.prepare()', async () => {
    const { startHook } = Next.initModule({
      entryPath: '/webview',
      noPrepare: false,
      serverOptions: { dev: true },
    });

    const receiver = moxy({ prepare: async () => {} });

    await expect(startHook!.$$factory(receiver)).resolves.toBe(undefined);

    expect(receiver.prepare.mock).toHaveBeenCalledTimes(1);
    expect(receiver.prepare.mock).toHaveBeenCalledWith();
  });

  test('default entryPath to "/"', async () => {
    const app = Machinat.createApp({
      modules: [
        Next.initModule({ noPrepare: false, serverOptions: { dev: true } }),
      ],
    });
    await app.start();

    const [routings] = app.useServices([Http.RequestRouteList]);
    expect(routings).toEqual([
      { name: 'next', path: '/', handler: expect.any(Function) },
    ]);
  });
});
