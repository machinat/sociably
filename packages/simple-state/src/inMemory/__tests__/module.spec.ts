import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
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

  const [controller] = app.useServices([Base.StateControllerI]);
  expect(controller).toBeInstanceOf(InMemoryStateController);
});
