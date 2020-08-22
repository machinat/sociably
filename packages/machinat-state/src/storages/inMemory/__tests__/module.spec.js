import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import InMemoryState from '..';
import { InMemoryRepository } from '../repository';
import StateController from '../../..';

test('export interfaces', () => {
  expect(InMemoryState.Repository).toBe(InMemoryRepository);
});

test('provisions', async () => {
  const app = Machinat.createApp({ modules: [InMemoryState.initModule()] });
  await app.start();

  const [controller, repository] = app.useServices([
    StateController,
    InMemoryState.Repository,
  ]);

  expect(controller).toBeInstanceOf(StateController);
  expect(repository).toBeInstanceOf(InMemoryRepository);
});

test('provide base state controller', async () => {
  const app = Machinat.createApp({ modules: [InMemoryState.initModule()] });
  await app.start();

  const [controller] = app.useServices([Base.StateControllerI]);
  expect(controller).toBeInstanceOf(StateController);
});
