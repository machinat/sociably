import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import { tmpNameSync } from 'tmp';
import FileState from '../module';
import { ControllerP as FileStateController } from '../controller';

const storageFilePath = tmpNameSync();

test('export interfaces', () => {
  expect(FileState.Controller).toBe(FileStateController);
  expect(FileState.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "FileStateConfigsI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);

  const { $$multi, $$name, $$typeof } = FileState.SerializerI;
  expect({ $$multi, $$name, $$typeof }).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "FileStateSerializerI",
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
    FileState.CONFIGS_I,
  ]);

  expect(controller).toBeInstanceOf(FileStateController);
  expect(configs).toEqual({ path: storageFilePath });
});

test('provide base state controller', async () => {
  const app = Machinat.createApp({
    modules: [FileState.initModule({ path: storageFilePath })],
  });
  await app.start();

  const [controller] = app.useServices([Base.StateControllerI]);
  expect(controller).toBeInstanceOf(FileStateController);
});
