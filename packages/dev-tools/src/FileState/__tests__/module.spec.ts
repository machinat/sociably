import Sociably from '@sociably/core';
import BaseStateControllerI from '@sociably/core/base/StateController';
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
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);

  const { $$multi, $$name, $$typeof } = FileState.Serializer;
  expect({ $$multi, $$name, $$typeof }).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "FileStateSerializer",
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

test('provisions', async () => {
  const app = Sociably.createApp({
    modules: [FileState.initModule({ path: storageFilePath })],
  });
  await app.start();

  const [fileController, baseController, configs, defaultSerializer] =
    app.useServices([
      FileStateController,
      BaseStateControllerI,
      FileState.Configs,
      FileState.Serializer,
    ]);

  expect(fileController).toBeInstanceOf(FileStateController);
  expect(baseController).toBe(fileController);
  expect(configs).toEqual({ path: storageFilePath });

  expect(defaultSerializer.parse(`{"foo":"bar"}`)).toEqual({ foo: 'bar' });
  expect(defaultSerializer.stringify({ foo: { bar: 'baz' } }))
    .toMatchInlineSnapshot(`
    "{
      \\"foo\\": {
        \\"bar\\": \\"baz\\"
      }
    }"
  `);
});
