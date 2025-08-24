import moxy from '@moxyjs/moxy';
import { BaseProfiler, SociablyProfile } from '../Profiler.js';

const fooProfiler = moxy({
  getUserProfile: async () =>
    ({
      platform: 'test',
      name: 'FOO',
      avatarUrl: 'http://foo...',
    }) as SociablyProfile,
});
const barProfiler = moxy({
  getUserProfile: async () =>
    ({
      platform: 'test',
      name: 'BAR',
      avatarUrl: 'http://bar...',
    }) as SociablyProfile,
});

const fooAgent = {
  $$typeofAgent: true as const,
  platform: 'foo',
  uid: 'foo.0',
};
const barAgent = {
  $$typeofAgent: true as const,
  platform: 'bar',
  uid: 'bar.0',
};

const fooUser1 = {
  $$typeofUser: true as const,
  platform: 'foo',
  uid: 'foo.1',
};
const fooUser2 = {
  $$typeofUser: true as const,
  platform: 'foo',
  uid: 'foo.2',
};
const barUser1 = {
  $$typeofUser: true as const,
  platform: 'bar',
  uid: 'bar.1',
};

const profiler = new BaseProfiler(
  new Map([
    ['foo', fooProfiler],
    ['bar', barProfiler],
  ]),
);

it('proxy #getUserProfile() call to the profiler corresponded to the user platform', async () => {
  await expect(profiler.getUserProfile(fooAgent, fooUser1)).resolves.toEqual({
    platform: 'test',
    name: 'FOO',
    avatarUrl: 'http://foo...',
  });
  await expect(profiler.getUserProfile(fooAgent, fooUser2)).resolves.toEqual({
    platform: 'test',
    name: 'FOO',
    avatarUrl: 'http://foo...',
  });
  await expect(profiler.getUserProfile(barAgent, barUser1)).resolves.toEqual({
    platform: 'test',
    name: 'BAR',
    avatarUrl: 'http://bar...',
  });

  expect(fooProfiler.getUserProfile).toHaveBeenCalledTimes(2);
  expect(fooProfiler.getUserProfile).toHaveBeenNthCalledWith(
    1,
    fooAgent,
    fooUser1,
  );
  expect(fooProfiler.getUserProfile).toHaveBeenNthCalledWith(
    2,
    fooAgent,
    fooUser2,
  );

  expect(barProfiler.getUserProfile).toHaveBeenCalledTimes(1);
  expect(barProfiler.getUserProfile).toHaveBeenCalledWith(barAgent, barUser1);
});

it('throw if platform of agent and user are not equal', async () => {
  await expect(
    profiler.getUserProfile(fooAgent, barUser1),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"agent (foo) and user (bar) platforms mismatch"`,
  );
});

it('throw if user from unsupported platform received', async () => {
  const bazAgent = {
    $$typeofAgent: true as const,
    platform: 'baz',
    uid: 'baz.0',
  };
  const bazUser = {
    $$typeofUser: true as const,
    platform: 'baz',
    uid: 'baz.1',
  };

  await expect(
    profiler.getUserProfile(bazAgent, bazUser),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"getting profile on "baz" platform is not supported"`,
  );
});
