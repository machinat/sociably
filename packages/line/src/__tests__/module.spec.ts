import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import Http from '@machinat/http';
import Line from '../module';
import { LineReceiver } from '../receiver';
import { LineProfiler, LineUserProfile, LineGroupProfile } from '../profiler';
import { LineBot } from '../bot';
import LineUser from '../user';
import LineChat from '../channel';

it('export interfaces', () => {
  expect(Line.Receiver).toBe(LineReceiver);
  expect(Line.Bot).toBe(LineBot);
  expect(Line.Profiler).toBe(LineProfiler);
  expect(Line.ConfigsI).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "LineConfigsI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

describe('initModule(configs)', () => {
  it('create module object', () => {
    const eventMiddlewares = [(ctx, next) => next(ctx)];
    const dispatchMiddlewares = [(ctx, next) => next(ctx)];

    const module = Line.initModule({
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      accessToken: '_ACCESS_TOKEN_',
      eventMiddlewares,
      dispatchMiddlewares,
    });

    expect(module.name).toBe('line');
    expect(module.mounterInterface).toMatchInlineSnapshot(`
      Object {
        "$$branched": false,
        "$$multi": false,
        "$$name": "LinePlatformMounterI",
        "$$typeof": Symbol(interface.service.machinat),
      }
    `);
    expect(module.provisions).toBeInstanceOf(Array);
    expect(typeof module.startHook).toBe('function');
    expect(module.eventMiddlewares).toEqual(eventMiddlewares);
    expect(module.dispatchMiddlewares).toEqual(dispatchMiddlewares);
  });

  test('provisions', async () => {
    const configs = {
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      accessToken: '_ACCESS_TOKEN_',
      channelSecret: '_CHANNEL_SECRET_',
      entryPath: '/webhook/line',
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Machinat.createApp({
      platforms: [Line.initModule(configs)],
    });
    await app.start();

    const [
      bot,
      receiver,
      configsProvided,
      profiler,
      routings,
    ] = app.useServices([
      Line.Bot,
      Line.Receiver,
      Line.ConfigsI,
      Line.Profiler,
      Http.RequestRouteList,
    ]);

    expect(bot).toBeInstanceOf(LineBot);
    expect(receiver).toBeInstanceOf(LineReceiver);
    expect(profiler).toBeInstanceOf(LineProfiler);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      { name: 'line', path: '/webhook/line', handler: expect.any(Function) },
    ]);
  });

  test('provisions when noServer', async () => {
    const configs = {
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      accessToken: '_ACCESS_TOKEN_',
      noServer: true,
    };

    const app = Machinat.createApp({
      platforms: [Line.initModule(configs)],
    });
    await app.start();

    const [bot, configsProvided, profiler, routings] = app.useServices([
      Line.Bot,
      Line.ConfigsI,
      Line.Profiler,
      Http.RequestRouteList,
    ]);

    expect(bot).toBeInstanceOf(LineBot);
    expect(profiler).toBeInstanceOf(LineProfiler);
    expect(configsProvided).toEqual(configs);

    expect(routings).toEqual([]);

    expect(() =>
      app.useServices([Line.Receiver])
    ).toThrowErrorMatchingInlineSnapshot(`"LineReceiver is not bound"`);
  });

  test('provide base interfaces', async () => {
    const app = Machinat.createApp({
      platforms: [
        Line.initModule({
          providerId: '_PROVIDER_ID_',
          channelId: '_BOT_CHANNEL_ID_',
          accessToken: '_ACCESS_TOKEN_',
          channelSecret: '_CHANNEL_SECRET_',
        }),
      ],
    });
    await app.start();

    const [bots, profilers, marshalTypes] = app.useServices([
      Base.Bot.PlatformMap,
      Base.Profiler.PlatformMap,
      Base.Marshaler.TypeI,
    ]);

    expect(bots.get('line')).toBeInstanceOf(LineBot);
    expect(profilers.get('line')).toBeInstanceOf(LineProfiler);
    expect(marshalTypes).toEqual(
      expect.arrayContaining([
        LineChat,
        LineUser,
        LineUserProfile,
        LineGroupProfile,
      ])
    );
  });

  test('default entryPath to "/"', async () => {
    const configs = {
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      accessToken: '_ACCESS_TOKEN_',
      shouldValidateRequest: false,
    };

    const app = Machinat.createApp({
      platforms: [Line.initModule(configs)],
    });
    await app.start();

    const [routings] = app.useServices([Http.RequestRouteList]);
    expect(routings).toEqual([
      { name: 'line', path: '/', handler: expect.any(Function) },
    ]);
  });

  test('#startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Line.initModule({
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      accessToken: '_ACCESS_TOKEN_',
      shouldValidateRequest: false,
    });

    await expect((module.startHook as any)(bot)).resolves.toBe(undefined);
    expect(bot.start.mock).toHaveBeenCalledTimes(1);
  });
});
