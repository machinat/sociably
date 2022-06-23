import moxy, { Moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import Http from '@sociably/http';
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
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
  expect(Next.Server).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "NextServer",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

describe('initModule()', () => {
  test('module object', () => {
    expect(
      Next.initModule({
        entryPath: '/webview',
        noPrepare: false,
        serverOptions: { dir: './webview' },
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
              "$$typeof": Symbol(interface.service.sociably),
            },
            "withValue": Object {
              "entryPath": "/webview",
              "handleRequest": [Function],
              "noPrepare": false,
              "serverOptions": Object {
                "dir": "./webview",
              },
            },
          },
          Object {
            "provide": Object {
              "$$multi": false,
              "$$name": "NextServer",
              "$$polymorphic": false,
              "$$typeof": Symbol(interface.service.sociably),
            },
            "withProvider": [Function],
          },
          Object {
            "provide": Object {
              "$$multi": true,
              "$$name": "HttpRequestRouteList",
              "$$polymorphic": false,
              "$$typeof": Symbol(interface.service.sociably),
            },
            "withProvider": [Function],
          },
        ],
        "startHook": [Function],
        "stopHook": [Function],
      }
    `);
  });

  test('provisions', async () => {
    const app = Sociably.createApp({
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

  test('register hmr route when dev', async () => {
    let app = Sociably.createApp({
      modules: [
        Next.initModule({
          entryPath: '/webview',
          noPrepare: false,
          serverOptions: { dev: true },
        }),
      ],
    });
    await app.start();

    let [upgradeRoutings] = app.useServices([Http.UpgradeRouteList]);
    expect(upgradeRoutings).toMatchInlineSnapshot(`
      Array [
        Object {
          "handler": [Function],
          "name": "webpack-hmr",
          "path": "/webview",
        },
      ]
    `);

    app = Sociably.createApp({
      modules: [
        Next.initModule({
          entryPath: '/webview',
          noPrepare: false,
          serverOptions: { dev: false },
        }),
      ],
    });
    await app.start();

    [upgradeRoutings] = app.useServices([Http.UpgradeRouteList]);
    expect(upgradeRoutings).toEqual([]);
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

  test('stopHook() call receiver.close()', async () => {
    const { stopHook } = Next.initModule({
      entryPath: '/webview',
      noPrepare: false,
      serverOptions: { dev: true },
    });

    const receiver = moxy({ close: async () => {} });

    await expect(stopHook!.$$factory(receiver)).resolves.toBe(undefined);

    expect(receiver.close.mock).toHaveBeenCalledTimes(1);
    expect(receiver.close.mock).toHaveBeenCalledWith();
  });

  test('default entryPath to "/"', async () => {
    const app = Sociably.createApp({
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
