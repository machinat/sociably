import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Auth from '../module';
import ControllerP from '../AuthController';

const secret = '_SECRET_';
const redirectUrl = '/webview';
const apiPath = '/auth';

it('export interfaces', () => {
  expect(Auth.Controller).toBe(ControllerP);
  expect(Auth.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "AuthConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(Auth.AuthenticatorList).toMatchInlineSnapshot(`
    Object {
      "$$multi": true,
      "$$name": "AuthAuthenticatorList",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

describe('initModule()', () => {
  test('provisions', async () => {
    const app = Machinat.createApp({
      modules: [Auth.initModule({ secret, apiPath, redirectUrl })],
      services: [{ provide: Auth.AuthenticatorList, withValue: moxy() }],
    });
    await app.start();

    const [controller, configs, routings] = app.useServices([
      Auth.Controller,
      Auth.Configs,
      Http.RequestRouteList,
    ]);

    expect(controller).toBeInstanceOf(ControllerP);
    expect(configs).toEqual({ secret, apiPath, redirectUrl });
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

  test('provide authenticators to controller', async () => {
    const fooAuthenticator = moxy();
    const barAuthenticator = moxy();
    const ControllerSpy = moxy(ControllerP);
    const app = Machinat.createApp({
      modules: [Auth.initModule({ secret, apiPath, redirectUrl })],
      services: [
        { provide: Auth.AuthenticatorList, withValue: fooAuthenticator },
        { provide: Auth.AuthenticatorList, withValue: barAuthenticator },
        {
          provide: Auth.Controller,
          withProvider: ControllerSpy,
        },
      ],
    });
    await app.start();

    expect(ControllerSpy.$$factory.mock).toHaveBeenCalledTimes(1);
    expect(ControllerSpy.$$factory.mock).toHaveBeenCalledWith(
      expect.arrayContaining([fooAuthenticator, barAuthenticator]),
      { secret, apiPath, redirectUrl }
    );
  });

  test('provide request handler calls to ServerController#delegateAuthRequest()', async () => {
    const fakeController = moxy({ delegateAuthRequest: async () => {} });
    const app = Machinat.createApp({
      modules: [Auth.initModule({ secret, redirectUrl, apiPath })],
      services: [
        {
          provide: Auth.Controller,
          withValue: fakeController,
        },
      ],
    });
    await app.start();

    const [[{ handler }]] = app.useServices([Http.RequestRouteList]);

    const req = moxy();
    const res = moxy();
    handler(req, res, {
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
