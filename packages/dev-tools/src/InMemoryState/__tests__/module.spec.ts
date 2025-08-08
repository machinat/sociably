import Sociably from '@sociably/core';
import StateRepositoryI from '@sociably/core/base/StateRepository.js';
import InMemoryState from '../module.js';
import { RepositoryP as InMemoryStateRepository } from '../InMemoryStateRepository.js';

test('provisions', async () => {
  const app = Sociably.createApp({ modules: [InMemoryState.initModule()] });
  await app.start();

  const [controller] = app.useServices([InMemoryStateRepository]);

  expect(controller).toBeInstanceOf(InMemoryStateRepository);
});

test('provide base state controller', async () => {
  const app = Sociably.createApp({ modules: [InMemoryState.initModule()] });
  await app.start();

  const [controller] = app.useServices([StateRepositoryI]);
  expect(controller).toBeInstanceOf(InMemoryStateRepository);
});
