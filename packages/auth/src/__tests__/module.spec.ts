import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import { InMemoryState } from '@machinat/dev-tools';
import Auth from '../module';
import BasicAuthenticator from '../basicAuth';
import ControllerP from '../Controller';
import HttpOperatorP from '../HttpOperator';

const secret = '_SECRET_';
const serverUrl = 'https://machinat.io';
const apiRoot = '/auth';

test('interfaces', () => {
  expect(Auth.Controller).toBe(ControllerP);
  expect(Auth.HttpOperator).toBe(HttpOperatorP);
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
      modules: [Auth.initModule({ secret, apiRoot, serverUrl })],
      services: [{ provide: Auth.AuthenticatorList, withValue: moxy() }],
    });
    await app.start();

    const [controller, operator, configs, routings, basicAuthenticator] =
      app.useServices([
        Auth.Controller,
        Auth.HttpOperator,
        Auth.Configs,
        Http.RequestRouteList,
        { require: BasicAuthenticator, optional: true },
      ]);

    expect(controller).toBeInstanceOf(ControllerP);
    expect(operator).toBeInstanceOf(HttpOperatorP);
    expect(configs).toEqual({ secret, apiRoot, serverUrl });
    expect(routings).toMatchInlineSnapshot(`
      Array [
        Object {
          "handler": [Function],
          "name": "auth",
          "path": "/auth",
        },
      ]
    `);
    expect(basicAuthenticator).toBe(null);
  });

  test('with basicAuth', async () => {
    const basicAuthOptions = {
      appName: 'Hello World',
      appImageUrl: 'https://machinat.com/img/logo.png',
    };
    const app = Machinat.createApp({
      modules: [
        InMemoryState.initModule(),
        Auth.initModule({
          secret,
          apiRoot,
          serverUrl,
          basicAuth: basicAuthOptions,
        }),
      ],
      services: [{ provide: Auth.AuthenticatorList, withValue: moxy() }],
    });
    await app.start();

    const [basicAuthenticator] = app.useServices([BasicAuthenticator]);
    expect(basicAuthenticator).toBeInstanceOf(BasicAuthenticator);
    expect(basicAuthenticator.appName).toBe('Hello World');
    expect(basicAuthenticator.appImageUrl).toBe(
      'https://machinat.com/img/logo.png'
    );
  });

  test('provide authenticators', async () => {
    const fooAuthenticator = moxy();
    const barAuthenticator = moxy();
    const ControllerSpy = moxy(ControllerP);
    const app = Machinat.createApp({
      modules: [Auth.initModule({ secret, apiRoot, serverUrl })],
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
      expect.any(HttpOperatorP),
      expect.arrayContaining([fooAuthenticator, barAuthenticator])
    );
  });

  it('register auth api entry', async () => {
    const fakeController = moxy({ delegateAuthRequest: async () => {} });
    const app = Machinat.createApp({
      modules: [Auth.initModule({ secret, serverUrl, apiRoot })],
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
