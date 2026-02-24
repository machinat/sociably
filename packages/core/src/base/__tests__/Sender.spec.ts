import moxy from '@moxyjs/moxy';
import { SociablySender, SociablyThread } from '../../types.js';
import { BaseSender } from '../Sender.js';

type UnknownSender = SociablySender<SociablyThread, unknown, unknown>;

const fooSender = moxy<UnknownSender>({ render: async () => 'FOO' } as never);
const barSender = moxy<UnknownSender>({ render: async () => 'BAR' } as never);

it('proxy .render() call to the sender corresponded to the thread platform', async () => {
  const sender = new BaseSender(
    new Map([
      ['foo', fooSender],
      ['bar', barSender],
    ]),
  );

  await expect(
    sender.render({ platform: 'foo', uid: 'foo1' }, 'hello world'),
  ).resolves.toBe('FOO');
  await expect(
    sender.render({ platform: 'bar', uid: 'bar1' }, 'hello world'),
  ).resolves.toBe('BAR');

  expect(fooSender.render).toHaveBeenCalledTimes(1);
  expect(fooSender.render).toHaveBeenCalledWith(
    { platform: 'foo', uid: 'foo1' },
    'hello world',
  );

  expect(barSender.render).toHaveBeenCalledTimes(1);
  expect(barSender.render).toHaveBeenCalledWith(
    { platform: 'bar', uid: 'bar1' },
    'hello world',
  );

  await expect(
    sender.render({ platform: 'foo', uid: 'foo2' }, 'hello world'),
  ).resolves.toBe('FOO');

  expect(fooSender.render).toHaveBeenCalledTimes(2);
  expect(fooSender.render).toHaveBeenCalledWith(
    { platform: 'foo', uid: 'foo2' },
    'hello world',
  );
});

it('throw if thread from unsupported platform received', async () => {
  const sender = new BaseSender(
    new Map([
      ['foo', fooSender],
      ['bar', barSender],
    ]),
  );

  await expect(
    sender.render({ platform: 'baz', uid: 'baz1' }, 'hello world'),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"thread of platform 'baz' is not supported"`,
  );
});
