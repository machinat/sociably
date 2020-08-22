import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import { tmpNameSync } from 'tmp';
import FileState from '..';
import { FileRepository } from '../repository';
import StateController from '../../..';

const storageFilePath = tmpNameSync();

test('export interfaces', () => {
  expect(FileState.Repository).toBe(FileRepository);
  expect(FileState.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "FileStateConfigsI",
      "$$typeof": Symbol(machinat.services.interface),
    }
  `);

  const { $$multi, $$name, $$typeof } = FileState.SerializerI;
  expect({ $$multi, $$name, $$typeof }).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "FileStateSerializer",
      "$$typeof": Symbol(machinat.services.interface),
    }
  `);
});

test('provisions', async () => {
  const app = Machinat.createApp({
    modules: [FileState.initModule({ path: storageFilePath })],
  });
  await app.start();

  const [controller, repository, configs] = app.useServices([
    StateController,
    FileState.Repository,
    FileState.CONFIGS_I,
  ]);

  expect(controller).toBeInstanceOf(StateController);
  expect(repository).toBeInstanceOf(FileRepository);
  expect(configs).toEqual({ path: storageFilePath });
});

test('provide base state controller', async () => {
  const app = Machinat.createApp({
    modules: [FileState.initModule({ path: storageFilePath })],
  });
  await app.start();

  const [controller] = app.useServices([Base.StateControllerI]);
  expect(controller).toBeInstanceOf(StateController);
});
