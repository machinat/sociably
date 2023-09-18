import moxy from '@moxyjs/moxy';
import { SociablyBot, SociablyThread } from '../../types.js';
import { BaseBot } from '../Bot.js';

type UnknownBot = SociablyBot<SociablyThread, unknown, unknown>;

const fooBot = moxy<UnknownBot>({ render: async () => 'FOO' } as never);
const barBot = moxy<UnknownBot>({ render: async () => 'BAR' } as never);

it('proxy .render() call to the bot corresponded to the thread platform', async () => {
  const bot = new BaseBot(
    new Map([
      ['foo', fooBot],
      ['bar', barBot],
    ]),
  );

  await expect(
    bot.render({ platform: 'foo', uid: 'foo1' }, 'hello world'),
  ).resolves.toBe('FOO');
  await expect(
    bot.render({ platform: 'bar', uid: 'bar1' }, 'hello world'),
  ).resolves.toBe('BAR');

  expect(fooBot.render).toHaveBeenCalledTimes(1);
  expect(fooBot.render).toHaveBeenCalledWith(
    { platform: 'foo', uid: 'foo1' },
    'hello world',
  );

  expect(barBot.render).toHaveBeenCalledTimes(1);
  expect(barBot.render).toHaveBeenCalledWith(
    { platform: 'bar', uid: 'bar1' },
    'hello world',
  );

  await expect(
    bot.render({ platform: 'foo', uid: 'foo2' }, 'hello world'),
  ).resolves.toBe('FOO');

  expect(fooBot.render).toHaveBeenCalledTimes(2);
  expect(fooBot.render).toHaveBeenCalledWith(
    { platform: 'foo', uid: 'foo2' },
    'hello world',
  );
});

it('throw if thread from unsupported platform received', async () => {
  const bot = new BaseBot(
    new Map([
      ['foo', fooBot],
      ['bar', barBot],
    ]),
  );

  await expect(
    bot.render({ platform: 'baz', uid: 'baz1' }, 'hello world'),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"thread of platform 'baz' is not supported"`,
  );
});
