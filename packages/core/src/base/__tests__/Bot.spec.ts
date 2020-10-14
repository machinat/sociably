import moxy from '@moxyjs/moxy';
import { BaseBot } from '../Bot';

const fooBot = moxy({ render: async () => 'FOO' });
const barBot = moxy({ render: async () => 'BAR' });

it('proxy #render() call to the bot branch corredponded to the channel', async () => {
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
