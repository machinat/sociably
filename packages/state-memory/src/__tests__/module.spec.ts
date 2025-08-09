import Sociably from '@sociably/core';
import MemoryRepositoryI from '@sociably/core/base/MemoryRepository.js';
import InMemoryStateRepository from '@sociably/dev-tools/InMemoryState';
import StateMemory from '../module.js';
import StateMemoryRepository from '../StateMemoryRepository.js';

test('export interfaces', () => {
  expect(StateMemory.Repository).toBe(StateMemoryRepository);
  expect(typeof StateMemory.initModule).toBe('function');
});

test('provisions', async () => {
  const app = Sociably.createApp({
    modules: [InMemoryStateRepository.initModule(), StateMemory.initModule()],
  });
  await app.start();

  const [memoryRepository, baseMemoryRepository] = app.useServices([
    StateMemory.Repository,
    MemoryRepositoryI,
  ]);

  expect(memoryRepository).toBeInstanceOf(StateMemoryRepository);
  expect(baseMemoryRepository).toBe(memoryRepository);

  await app.stop();
});

test('provide base memory repository interface', async () => {
  const app = Sociably.createApp({
    modules: [InMemoryStateRepository.initModule(), StateMemory.initModule()],
  });
  await app.start();

  const [memoryRepository] = app.useServices([MemoryRepositoryI]);
  expect(memoryRepository).toBeInstanceOf(StateMemoryRepository);

  await app.stop();
});
