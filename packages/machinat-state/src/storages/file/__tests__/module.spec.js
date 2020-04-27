import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import FileState from '..';
import FileRepository from '../repository';
import StateController from '../../..';

test('export interfaces', () => {
  expect(FileState.Repository).toBe(FileRepository);
  expect(FileState.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "FileStateConfigs",
      "$$typeof": Symbol(machinat.services.interface),
    }
  `);
});

test('provisions', async () => {
  const app = Machinat.createApp({
    modules: [FileState.initModule({ path: '/stroage/file/path' })],
  });
  await app.start();

  const [controller, repository, configs] = app.useServices([
    StateController,
    FileState.Repository,
    FileState.CONFIGS_I,
  ]);

  expect(controller).toBeInstanceOf(StateController);
  expect(repository).toBeInstanceOf(FileRepository);
  expect(configs).toEqual({ path: '/stroage/file/path' });
});

test('provide base state controller', async () => {
  const app = Machinat.createApp({
    modules: [FileState.initModule({ path: '/stroage/file/path' })],
  });
  await app.start();

  const [controller] = app.useServices([Base.StateControllerI]);
  expect(controller).toBeInstanceOf(StateController);
});
