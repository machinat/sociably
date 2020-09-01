import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import InMemoryState from '../module';
import { InMemoryStateRepository } from '../repository';
import { StateController } from '../../../controller';

test('export interfaces', () => {
  expect(InMemoryState.Repository).toBe(InMemoryStateRepository);
});

test('provisions', async () => {
  const app = Machinat.createApp({ modules: [InMemoryState.initModule()] });
  await app.start();

  const [controller, repository] = app.useServices([
    StateController,
    InMemoryState.Repository,
  ]);

  expect(controller).toBeInstanceOf(StateController);
  expect(repository).toBeInstanceOf(InMemoryStateRepository);
});

test('provide base state controller', async () => {
  const app = Machinat.createApp({ modules: [InMemoryState.initModule()] });
  await app.start();

  const [controller] = app.useServices([Base.StateControllerI]);
  expect(controller).toBeInstanceOf(StateController);
});
