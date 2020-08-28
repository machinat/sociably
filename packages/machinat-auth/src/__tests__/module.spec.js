import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import HTTP from '@machinat/http';
import Auth from '..';
import ServerController from '../server';

it('export interfaces', () => {
  expect(Auth.Controller).toBe(ServerController);
  expect(Auth.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "AuthModuleConfigs",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(Auth.AUTHORIZERS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": true,
      "$$name": "ServerAuthorizersList",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

describe('initModule()', () => {
  test('provisions', async () => {
    const app = Machinat.createApp({
      modules: [Auth.initModule({ secret: '_SECRET_', entryPath: '/auth' })],
      bindings: [{ provide: Auth.AUTHORIZERS_I, withValue: moxy() }],
    });
    await app.start();

    const [controller, configs, routings] = app.useServices([
      Auth.Controller,
      Auth.CONFIGS_I,
      HTTP.REQUEST_ROUTINGS_I,
    ]);

    expect(controller).toBeInstanceOf(ServerController);
    expect(configs).toEqual({ secret: '_SECRET_', entryPath: '/auth' });
    expect(routings).toMatchInlineSnapshot(`
      Array [
        Object {
          "handler": [Function],
          "name": "auth",
          "path": "/auth",
        },
      ]
    `);
  });

  test('provide authorizers to controller', async () => {
    const fooAuthorizer = moxy();
    const barAuthorizer = moxy();
    const ServerControllerSpy = moxy(ServerController);
    const app = Machinat.createApp({
      modules: [Auth.initModule({ secret: '_SECRET_', entryPath: '/auth' })],
      bindings: [
        { provide: Auth.AUTHORIZERS_I, withValue: fooAuthorizer },
        { provide: Auth.AUTHORIZERS_I, withValue: barAuthorizer },
        {
          provide: Auth.Controller,
          withProvider: ServerControllerSpy,
        },
      ],
    });
    await app.start();

    expect(ServerControllerSpy.$$factory.mock).toHaveBeenCalledTimes(1);
    expect(
      ServerControllerSpy.$$factory.mock
    ).toHaveBeenCalledWith(
      expect.arrayContaining([fooAuthorizer, barAuthorizer]),
      { secret: '_SECRET_', entryPath: '/auth' }
    );
  });

  test('provide request handler calls to ServerController#delegateAuthRequest()', async () => {
    const fakeController = moxy({ delegateAuthRequest: async () => {} });
    const app = Machinat.createApp({
      modules: [Auth.initModule({ secret: '_SECRET_', entryPath: '/auth' })],
      bindings: [
        {
          provide: Auth.Controller,
          withValue: fakeController,
        },
      ],
    });
    await app.start();

    const [[{ handler }]] = app.useServices([HTTP.REQUEST_ROUTINGS_I]);

    const req = moxy();
    const res = moxy();
    await handler(req, res);

    expect(fakeController.delegateAuthRequest.mock).toHaveBeenCalledTimes(1);
    expect(fakeController.delegateAuthRequest.mock).toHaveBeenCalledWith(
      req,
      res
    );
  });
});
