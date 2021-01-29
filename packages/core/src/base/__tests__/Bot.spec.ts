import moxy from '@moxyjs/moxy';
import { MachinatBot, MachinatChannel } from '../../types';
import { BaseBot } from '../Bot';

type UnknownBot = MachinatBot<MachinatChannel, unknown, unknown>;

const fooBot = moxy<UnknownBot>({ render: async () => 'FOO' } as never);
const barBot = moxy<UnknownBot>({ render: async () => 'BAR' } as never);

it('proxy #render() call to the bot corresponded to the channel platform', async () => {
  const bot = new BaseBot(
    new Map([
      ['foo', fooBot],
      ['bar', barBot],
    ])
  );

  await expect(
    bot.render({ platform: 'foo', uid: 'foo1' }, 'hello world')
  ).resolves.toBe('FOO');
  await expect(
    bot.render({ platform: 'bar', uid: 'bar1' }, 'hello world')
  ).resolves.toBe('BAR');

  expect(fooBot.render.mock).toHaveBeenCalledTimes(1);
  expect(fooBot.render.mock).toHaveBeenCalledWith(
    { platform: 'foo', uid: 'foo1' },
    'hello world'
  );

  expect(barBot.render.mock).toHaveBeenCalledTimes(1);
  expect(barBot.render.mock).toHaveBeenCalledWith(
    { platform: 'bar', uid: 'bar1' },
    'hello world'
  );

  await expect(
    bot.render({ platform: 'foo', uid: 'foo2' }, 'hello world')
  ).resolves.toBe('FOO');

  expect(fooBot.render.mock).toHaveBeenCalledTimes(2);
  expect(fooBot.render.mock).toHaveBeenCalledWith(
    { platform: 'foo', uid: 'foo2' },
    'hello world'
  );
});

it('throw if channel from unsupported platform received', async () => {
  const bot = new BaseBot(
    new Map([
      ['foo', fooBot],
      ['bar', barBot],
    ])
  );

  await expect(
    bot.render({ platform: 'baz', uid: 'baz1' }, 'hello world')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"channel of platform 'baz' is not supported"`
  );
});
