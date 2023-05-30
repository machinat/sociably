import Sociably from '@sociably/core';
import StateControllerI from '@sociably/core/base/StateController';
import InMemoryState from '../module.js';
import { ControllerP as InMemoryStateController } from '../controller.js';

test('provisions', async () => {
  const app = Sociably.createApp({ modules: [InMemoryState.initModule()] });
  await app.start();

  const [controller] = app.useServices([InMemoryStateController]);

  expect(controller).toBeInstanceOf(InMemoryStateController);
});

test('provide base state controller', async () => {
  const app = Sociably.createApp({ modules: [InMemoryState.initModule()] });
  await app.start();

  const [controller] = app.useServices([StateControllerI]);
  expect(controller).toBeInstanceOf(InMemoryStateController);
});
