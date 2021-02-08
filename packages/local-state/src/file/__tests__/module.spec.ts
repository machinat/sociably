import Machinat from '@machinat/core';
import StateControllerI from '@machinat/core/base/StateController';
import { tmpNameSync } from 'tmp';
import FileState from '../module';
import { ControllerP as FileStateController } from '../controller';

const storageFilePath = tmpNameSync();

test('export interfaces', () => {
  expect(FileState.Controller).toBe(FileStateController);
  expect(FileState.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "FileStateConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);

  const { $$multi, $$name, $$typeof } = FileState.Serializer;
  expect({ $$multi, $$name, $$typeof }).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "FileStateSerializer",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

test('provisions', async () => {
  const app = Machinat.createApp({
    modules: [FileState.initModule({ path: storageFilePath })],
  });
  await app.start();

  const [controller, configs] = app.useServices([
    FileStateController,
    FileState.Configs,
  ]);

  expect(controller).toBeInstanceOf(FileStateController);
  expect(configs).toEqual({ path: storageFilePath });
});

test('provide base state controller', async () => {
  const app = Machinat.createApp({
    modules: [FileState.initModule({ path: storageFilePath })],
  });
  await app.start();

  const [controller] = app.useServices([StateControllerI]);
  expect(controller).toBeInstanceOf(FileStateController);
});
