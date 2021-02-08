import Machinat from '@machinat/core';
import StateControllerI from '@machinat/core/base/StateControllerI';
import InMemoryState from '../module';
import { ControllerP as InMemoryStateController } from '../controller';

test('provisions', async () => {
  const app = Machinat.createApp({ modules: [InMemoryState.initModule()] });
  await app.start();

  const [controller] = app.useServices([InMemoryStateController]);

  expect(controller).toBeInstanceOf(InMemoryStateController);
});

test('provide base state controller', async () => {
  const app = Machinat.createApp({ modules: [InMemoryState.initModule()] });
  await app.start();

  const [controller] = app.useServices([StateControllerI]);
  expect(controller).toBeInstanceOf(InMemoryStateController);
});
