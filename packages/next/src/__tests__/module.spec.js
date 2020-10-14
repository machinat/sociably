import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import HTTP from '@machinat/http';
import createNextApp from 'next';
import { NextReceiver } from '../receiver';
import Next from '../module';

jest.mock('next', () =>
  jest.requireActual('@moxyjs/moxy').default(() => ({
    prepare: async () => {},
    getRequestHandler: () => {},
  }))
);

it('exports interfaces', () => {
  expect(Next.Receiver).toBe(NextReceiver);
  expect(Next.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "NextModuleConfigsI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(Next.SERVER_I).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "NextServerI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

describe('initModule()', () => {
  test('module object', () => {
    expect(
      Next.initModule({
        entryPath: '/webview',
        shouldPrepare: true,
        nextAppOptions: { dev: true },
        eventMiddlewares: [(ctx, next) => next(ctx)],
      })
    ).toMatchInlineSnapshot(`
      Object {
        "eventMiddlewares": Array [
          [Function],
        ],
        "mounterInterface": Object {
          "$$branched": false,
          "$$multi": false,
          "$$name": "NextPlatformMounterI",
          "$$typeof": Symbol(interface.service.machinat),
        },
        "name": "next",
        "provisions": Array [
          [Function],
          Object {
            "provide": Object {
              "$$branched": false,
              "$$multi": false,
              "$$name": "NextModuleConfigsI",
              "$$typeof": Symbol(interface.service.machinat),
            },
            "withValue": Object {
              "entryPath": "/webview",
              "eventMiddlewares": Array [
                [Function],
              ],
              "nextAppOptions": Object {
                "dev": true,
              },
              "shouldPrepare": true,
            },
          },
          Object {
            "provide": Object {
              "$$branched": false,
              "$$multi": false,
              "$$name": "NextServerI",
              "$$typeof": Symbol(interface.service.machinat),
            },
            "withProvider": [Function],
          },
          Object {
            "provide": Object {
              "$$branched": false,
              "$$multi": true,
              "$$name": "HTTPRequestRoutingsListI",
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
      platforms: [
        Next.initModule({
          entryPath: '/webview',
          shouldPrepare: true,
          nextAppOptions: { dev: true },
        }),
      ],
    });
    await app.start();

    const [receiver, nextApp, configs, routings] = app.useServices([
      Next.Receiver,
      Next.SERVER_I,
      Next.CONFIGS_I,
      HTTP.REQUEST_ROUTINGS_I,
    ]);

    expect(receiver).toBeInstanceOf(NextReceiver);
    expect(configs).toEqual({
      entryPath: '/webview',
      shouldPrepare: true,
      nextAppOptions: { dev: true },
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
      shouldPrepare: true,
      nextAppOptions: { dev: true },
    });

    const receiver = moxy({ prepare: async () => {} });

    await expect(startHook(receiver)).resolves.toBe(undefined);

    expect(receiver.prepare.mock).toHaveBeenCalledTimes(1);
    expect(receiver.prepare.mock).toHaveBeenCalledWith();
  });

  test('default entryPath to "/"', async () => {
    const app = Machinat.createApp({
      modules: [
        Next.initModule({ shouldPrepare: true, nextAppOptions: { dev: true } }),
      ],
    });
    await app.start();

    const [routings] = app.useServices([HTTP.REQUEST_ROUTINGS_I]);
    expect(routings).toEqual([
      { name: 'next', path: '/', handler: expect.any(Function) },
    ]);
  });
});
