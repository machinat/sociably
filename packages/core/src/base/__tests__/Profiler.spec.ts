import moxy from '@moxyjs/moxy';
import { BaseProfiler } from '../Profiler';

const fooProfiler = moxy({ getUserProfile: async () => 'FOO' });
const barProfiler = moxy({ getUserProfile: async () => 'BAR' });

it('proxy #getUserProfile() call to the profiler branch corredponded to the user', async () => {
  const profiler = new BaseProfiler(
    new Map([
      ['foo', fooProfiler],
      ['bar', barProfiler],
    ])
  );

  await expect(
    profiler.getUserProfile({ platform: 'foo', uid: 'foo1' })
  ).resolves.toBe('FOO');
  await expect(
    profiler.getUserProfile({ platform: 'bar', uid: 'bar1' })
  ).resolves.toBe('BAR');

  expect(fooProfiler.getUserProfile.mock).toHaveBeenCalledTimes(1);
  expect(fooProfiler.getUserProfile.mock).toHaveBeenCalledWith({
    platform: 'foo',
    uid: 'foo1',
  });

  expect(barProfiler.getUserProfile.mock).toHaveBeenCalledTimes(1);
  expect(barProfiler.getUserProfile.mock).toHaveBeenCalledWith({
    platform: 'bar',
    uid: 'bar1',
  });

  await expect(
    profiler.getUserProfile({ platform: 'foo', uid: 'foo2' })
  ).resolves.toBe('FOO');

  expect(fooProfiler.getUserProfile.mock).toHaveBeenCalledTimes(2);
  expect(fooProfiler.getUserProfile.mock).toHaveBeenCalledWith({
    platform: 'foo',
    uid: 'foo2',
  });
});

it('throw if user from unsupported platform received', async () => {
  const profiler = new BaseProfiler(
    new Map([
      ['foo', fooProfiler],
      ['bar', barProfiler],
    ])
  );

  await expect(
    profiler.getUserProfile({ platform: 'baz', uid: 'baz1' })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"user of platform 'baz' is not supported"`
  );
});
