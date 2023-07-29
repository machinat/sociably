import Sociably from '@sociably/core';
import Http from '@sociably/http';
import { InMemoryState } from '@sociably/dev-tools';
import MetaApi from '../module.js';
import { MetaWebhookReceiver } from '../Receiver.js';

it('export interfaces', () => {
  expect(MetaApi.Receiver).toBe(MetaWebhookReceiver);
  expect(MetaApi.Configs).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "MetaApiConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

describe('initModule(configs)', () => {
  it('create module object', () => {
    const module = MetaApi.initModule({
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      shouldHandleChallenge: true,
      shouldVerifyRequest: true,
    });

    expect(module.provisions).toBeInstanceOf(Array);
    expect(module.startHook).toBe(undefined);
    expect(module.stopHook).toBe(undefined);
  });

  test('provisions', async () => {
    const configs = {
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      webhookPath: 'webhook/facebook',
    };
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
        MetaApi.initModule(configs),
      ],
      platforms: [],
    });
    await app.start();

    const [receiver, configsProvided, routings] = app.useServices([
      MetaApi.Receiver,
      MetaApi.Configs,
      Http.RequestRouteList,
    ]);

    expect(receiver).toBeInstanceOf(MetaWebhookReceiver);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      {
        name: 'meta-api',
        path: 'webhook/facebook',
        handler: expect.any(Function),
      },
    ]);
  });

  test('default webhookPath to "."', async () => {
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
        MetaApi.initModule({
          appSecret: '...',
          verifyToken: '...',
        }),
      ],
    });
    await app.start();

    const [routings] = app.useServices([Http.RequestRouteList]);
    expect(routings).toEqual([
      {
        name: 'meta-api',
        path: '.',
        handler: expect.any(Function),
      },
    ]);
  });
});
