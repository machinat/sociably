import moxy from '@moxyjs/moxy';
import { BaseProfiler, SociablyProfile } from '../Profiler';

const fooProfiler = moxy({
  getUserProfile: async () =>
    ({
      platform: 'test',
      name: 'FOO',
      avatarUrl: 'http://foo...',
    } as SociablyProfile),
});
const barProfiler = moxy({
  getUserProfile: async () =>
    ({
      platform: 'test',
      name: 'BAR',
      avatarUrl: 'http://bar...',
    } as SociablyProfile),
});

const fooChannel = {
  platform: 'foo',
  uid: 'foo.0',
  uniqueIdentifier: { platform: 'foo', id: '0' },
};
const barChannel = {
  platform: 'bar',
  uid: 'bar.0',
  uniqueIdentifier: { platform: 'bar', id: '0' },
};

const fooUser1 = {
  platform: 'foo',
  uid: 'foo.1',
  uniqueIdentifier: { platform: 'foo', id: '1' },
};
const fooUser2 = {
  platform: 'foo',
  uid: 'foo.2',
  uniqueIdentifier: { platform: 'foo', id: '2' },
};
const barUser1 = {
  platform: 'bar',
  uid: 'bar.1',
  uniqueIdentifier: { platform: 'bar', id: '1' },
};

const profiler = new BaseProfiler(
  new Map([
    ['foo', fooProfiler],
    ['bar', barProfiler],
  ])
);

it('proxy #getUserProfile() call to the profiler corresponded to the user platform', async () => {
  await expect(profiler.getUserProfile(fooChannel, fooUser1)).resolves.toEqual({
    platform: 'test',
    name: 'FOO',
    avatarUrl: 'http://foo...',
  });
  await expect(profiler.getUserProfile(fooChannel, fooUser2)).resolves.toEqual({
    platform: 'test',
    name: 'FOO',
    avatarUrl: 'http://foo...',
  });
  await expect(profiler.getUserProfile(barChannel, barUser1)).resolves.toEqual({
    platform: 'test',
    name: 'BAR',
    avatarUrl: 'http://bar...',
  });

  expect(fooProfiler.getUserProfile).toHaveBeenCalledTimes(2);
  expect(fooProfiler.getUserProfile).toHaveBeenNthCalledWith(
    1,
    fooChannel,
    fooUser1
  );
  expect(fooProfiler.getUserProfile).toHaveBeenNthCalledWith(
    2,
    fooChannel,
    fooUser2
  );

  expect(barProfiler.getUserProfile).toHaveBeenCalledTimes(1);
  expect(barProfiler.getUserProfile).toHaveBeenCalledWith(barChannel, barUser1);
});

it('throw if paltform of channel and user are not equal', async () => {
  await expect(
    profiler.getUserProfile(fooChannel, barUser1)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"channel (foo) and user (bar) platforms mismatch"`
  );
});

it('throw if user from unsupported platform received', async () => {
  const bazChannel = {
    platform: 'baz',
    uid: 'baz.0',
    uniqueIdentifier: { platform: 'baz', id: '0' },
  };
  const bazUser = {
    platform: 'baz',
    uid: 'baz.1',
    uniqueIdentifier: { platform: 'baz', id: '1' },
  };

  await expect(
    profiler.getUserProfile(bazChannel, bazUser)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"getting profile on \\"baz\\" platform is not supported"`
  );
});
