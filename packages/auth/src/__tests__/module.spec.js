import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import HTTP from '@machinat/http';
import Auth from '../module';
import { AuthController } from '../controller';

it('export interfaces', () => {
  expect(Auth.Controller).toBe(AuthController);
  expect(Auth.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "AuthModuleConfigsI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(Auth.AUTHORIZERS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": true,
      "$$name": "AuthAuthorizersListI",
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

    expect(controller).toBeInstanceOf(AuthController);
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
    const ControllerSpy = moxy(AuthController);
    const app = Machinat.createApp({
      modules: [Auth.initModule({ secret: '_SECRET_', entryPath: '/auth' })],
      bindings: [
        { provide: Auth.AUTHORIZERS_I, withValue: fooAuthorizer },
        { provide: Auth.AUTHORIZERS_I, withValue: barAuthorizer },
        {
          provide: Auth.Controller,
          withProvider: ControllerSpy,
        },
      ],
    });
    await app.start();

    expect(ControllerSpy.$$factory.mock).toHaveBeenCalledTimes(1);
    expect(
      ControllerSpy.$$factory.mock
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
    await handler(req, res, {
      originalPath: '/auth/foo',
      matchedPath: '/auth',
      trailingPath: 'foo',
    });

    expect(fakeController.delegateAuthRequest.mock).toHaveBeenCalledTimes(1);
    expect(fakeController.delegateAuthRequest.mock).toHaveBeenCalledWith(
      req,
      res,
      { originalPath: '/auth/foo', matchedPath: '/auth', trailingPath: 'foo' }
    );
  });
});