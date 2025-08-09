import Sociably from '@sociably/core';
import BaseStateRepositoryI from '@sociably/core/base/StateRepository.js';
import { tmpNameSync } from 'tmp';
import FileState from '../module.js';
import { RepositoryP as FileStateRepository } from '../FileStateRepository.js';

const storageFilePath = tmpNameSync();

test('export interfaces', () => {
  expect(FileState.Repository).toBe(FileStateRepository);
  expect(FileState.Configs).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "FileStateConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);

  const { $$multi, $$name, $$typeof } = FileState.Serializer;
  expect({ $$multi, $$name, $$typeof }).toMatchInlineSnapshot(`
    {
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
      FileStateRepository,
      BaseStateRepositoryI,
      FileState.Configs,
      FileState.Serializer,
    ]);

  expect(fileController).toBeInstanceOf(FileStateRepository);
  expect(baseController).toBe(fileController);
  expect(configs).toEqual({ path: storageFilePath });

  expect(defaultSerializer.parse(`{"foo":"bar"}`)).toEqual({ foo: 'bar' });
  expect(defaultSerializer.stringify({ foo: { bar: 'baz' } }))
    .toMatchInlineSnapshot(`
    "{
      "foo": {
        "bar": "baz"
      }
    }"
  `);
});
