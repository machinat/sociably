/* eslint-disable no-await-in-loop */
import moxy from '@moxyjs/moxy';
import {
  BaseStateRepository,
  StateAccessor,
} from '@sociably/core/base/StateRepository.js';
import { StateMemoryRepository } from '../StateMemoryRepository.js';

const stateAccessor = moxy<StateAccessor>({
  get: async () => undefined,
  set: async () => false,
  update: async (_, updator) => updator(undefined),
  delete: async () => false,
  keys: async () => [],
  getAll: async () => new Map(),
  getAllStartWithKey: async () => new Map(),
  clear: async () => undefined,
});

const baseStateRepository = moxy<BaseStateRepository>({
  agentState: () => stateAccessor,
  threadState: () => stateAccessor,
  userState: () => stateAccessor,
  globalState: () => stateAccessor,
});

beforeEach(() => {
  stateAccessor.mock.reset();
  baseStateRepository.mock.reset();
});

const repository = new StateMemoryRepository(baseStateRepository);

const agent = {
  $$typeofAgent: true as const,
  platform: 'test',
  uid: 'agent.test',
};
const anotherAgent = {
  $$typeofAgent: true as const,
  platform: 'test',
  uid: 'another_agent.test',
};

const thread = {
  $$typeofThread: true as const,
  platform: 'test',
  uid: 'thread.test',
};
const anotherThread = {
  $$typeofThread: true as const,
  platform: 'test',
  uid: 'another_thread.test',
};

const user = {
  $$typeofUser: true as const,
  platform: 'test',
  uid: 'user.test',
};
const anotherUser = {
  $$typeofUser: true as const,
  platform: 'test',
  uid: 'another_user.test',
};

describe.each([
  [
    'agent memory',
    repository.agentMemory(agent),
    repository.agentMemory(anotherAgent),
    'channel',
  ],
  [
    'thread memory',
    repository.threadMemory(thread),
    repository.threadMemory(anotherThread),
    'thread',
  ],
  [
    'user memory',
    repository.userMemory(user),
    repository.userMemory(anotherUser),
    'user',
  ],
  [
    'global memory',
    repository.globalMemory('test.foo'),
    repository.globalMemory('test.bar'),
    'global',
  ],
])('%s', (_, fooMemory, barMemory) => {
  test('.add(resource, value)', async () => {
    stateAccessor.set.mock.fakeResolvedValue(true);

    const id1 = await fooMemory.add('resource1', 'foo');
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(0);
    expect(stateAccessor.set).toHaveBeenCalledTimes(1);
    expect(stateAccessor.set).toHaveBeenCalledWith(
      `$memory:resource1:${id1}`,
      'foo',
    );

    const id2 = await barMemory.add('resource2', { bar: 'baz' });
    expect(typeof id2).toBe('string');
    expect(id2.length).toBeGreaterThan(0);
    expect(id2).not.toBe(id1);
    expect(stateAccessor.set).toHaveBeenCalledTimes(2);
    expect(stateAccessor.set).toHaveBeenCalledWith(`$memory:resource2:${id2}`, {
      bar: 'baz',
    });
  });

  test('.get(resource, id)', async () => {
    await expect(fooMemory.get('resource1', 'id1')).resolves.toBe(undefined);
    expect(stateAccessor.get).toHaveBeenCalledTimes(1);
    expect(stateAccessor.get).toHaveBeenCalledWith('$memory:resource1:id1');

    stateAccessor.get.mock.fakeResolvedValue('foo');
    await expect(fooMemory.get('resource2', 'id2')).resolves.toBe('foo');
    expect(stateAccessor.get).toHaveBeenCalledTimes(2);
    expect(stateAccessor.get).toHaveBeenCalledWith('$memory:resource2:id2');

    stateAccessor.get.mock.fakeResolvedValue({ bar: 'baz' });
    await expect(barMemory.get('resource3', 'id3')).resolves.toEqual({
      bar: 'baz',
    });
    expect(stateAccessor.get).toHaveBeenCalledTimes(3);
    expect(stateAccessor.get).toHaveBeenCalledWith('$memory:resource3:id3');
  });

  describe('.update(resource, id, changes)', () => {
    it('update value with partial changes', async () => {
      const existingValue = { name: 'John', age: 30, city: 'NYC' };
      stateAccessor.update.mock.fake(async (key, updator) =>
        updator(existingValue),
      );

      await expect(
        fooMemory.update('resource1', 'id1', { age: 31, city: 'LA' }),
      ).resolves.toEqual({
        name: 'John',
        age: 31,
        city: 'LA',
      });

      expect(stateAccessor.update).toHaveBeenCalledTimes(1);
      expect(stateAccessor.update).toHaveBeenCalledWith(
        '$memory:resource1:id1',
        expect.any(Function),
      );
    });

    it('filters out undefined values from changes', async () => {
      const existingValue = { name: 'John', age: 30, city: 'NYC' };
      stateAccessor.update.mock.fake(async (key, updator) =>
        updator(existingValue),
      );

      const changes = { age: 31, city: undefined, country: 'USA' };
      await expect(
        fooMemory.update('resource2', 'id2', changes),
      ).resolves.toEqual({
        name: 'John',
        age: 31,
        city: 'NYC', // unchanged because city was undefined in changes
        country: 'USA',
      });

      expect(stateAccessor.update).toHaveBeenCalledTimes(1);
    });

    it('throws error if resource not found', async () => {
      stateAccessor.update.mock.fake(async (key, updator) =>
        updator(undefined),
      );

      const changes = { name: 'Jane' };
      await expect(
        fooMemory.update('resource1', 'id1', changes),
      ).rejects.toThrow(
        'StateMemoryAccessor: resource "resource1" with id "id1" not found',
      );

      expect(stateAccessor.update).toHaveBeenCalledTimes(1);
      expect(stateAccessor.update).toHaveBeenCalledWith(
        '$memory:resource1:id1',
        expect.any(Function),
      );
    });
  });

  test('.delete(resource, id)', async () => {
    await expect(fooMemory.delete('resource1', 'id1')).resolves.toBe(false);
    expect(stateAccessor.delete).toHaveBeenCalledTimes(1);
    expect(stateAccessor.delete).toHaveBeenCalledWith('$memory:resource1:id1');

    stateAccessor.delete.mock.fakeResolvedValue(true);

    await expect(barMemory.delete('resource1', 'id1')).resolves.toBe(true);
    expect(stateAccessor.delete).toHaveBeenCalledTimes(2);
    expect(stateAccessor.delete).toHaveBeenCalledWith('$memory:resource1:id1');

    await expect(fooMemory.delete('resource2', 'id2')).resolves.toBe(true);
    expect(stateAccessor.delete).toHaveBeenCalledTimes(3);
    expect(stateAccessor.delete).toHaveBeenCalledWith('$memory:resource2:id2');
  });

  test('.getAll(resource)', async () => {
    await expect(fooMemory.getAll('resource1')).resolves.toEqual({});
    expect(stateAccessor.getAllStartWithKey).toHaveBeenCalledTimes(1);
    expect(stateAccessor.getAllStartWithKey).toHaveBeenCalledWith(
      '$memory:resource1:',
    );

    stateAccessor.getAllStartWithKey.mock.fakeResolvedValue(
      new Map<string, unknown>([
        ['$memory:resource1:id1', 'foo'],
        ['$memory:resource1:id2', { bar: ['baz'] }],
      ]),
    );
    await expect(fooMemory.getAll('resource1')).resolves.toEqual({
      id1: 'foo',
      id2: { bar: ['baz'] },
    });
    expect(stateAccessor.getAllStartWithKey).toHaveBeenCalledTimes(2);

    stateAccessor.getAllStartWithKey.mock.fakeResolvedValue(
      new Map<string, unknown>([['$memory:resource2:id1', 123]]),
    );
    await expect(barMemory.getAll('resource2')).resolves.toEqual({ id1: 123 });
    expect(stateAccessor.getAllStartWithKey).toHaveBeenCalledTimes(3);
    expect(stateAccessor.getAllStartWithKey).toHaveBeenCalledWith(
      '$memory:resource2:',
    );
  });
});
