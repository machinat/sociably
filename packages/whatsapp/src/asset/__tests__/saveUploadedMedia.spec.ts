import { DispatchError } from '@sociably/core/engine';
import moxy from '@moxyjs/moxy';
import WhatsAppAgent from '../../Agent.js';
import WhatsAppChat from '../../Chat.js';
import saveUploadedMedia from '../saveUploadedMedia.js';
import AssetsManager from '../AssetsManager.js';

const manager = moxy<AssetsManager>({
  saveMedia: async () => {},
} as never);

beforeEach(() => {
  manager.mock.clear();
});

const msgResult = { code: 200, headers: {}, body: {} };
const chat = new WhatsAppChat('9876543210', '1234567890');
const agent = new WhatsAppAgent('9876543210');
const plainJob = {
  request: { method: 'POST', url: 'foo' },
  channel: agent,
};

it('do nothing when job has no assetTag', async () => {
  const jobs = [plainJob, plainJob, plainJob];
  const tasks = [{ type: 'dispatch' as const, payload: jobs }];
  const response = { jobs, tasks, results: [msgResult, msgResult, msgResult] };
  const next = moxy(async () => response);
  const context = {
    platform: 'whatsapp',
    jobs,
    tasks,
    node: null,
    target: chat,
  };

  await expect(saveUploadedMedia(manager)(context, next)).resolves.toEqual(
    response,
  );

  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith(context);

  expect(manager.saveMedia).not.toHaveBeenCalled();
});

it('save created assets', async () => {
  const jobs = [
    {
      ...plainJob,
      file: { data: 'FOO' },
      assetTag: 'foo',
    },
    { ...plainJob },
    {
      ...plainJob,
      file: { data: 'BAR' },
      assetTag: 'bar',
    },
    { ...plainJob, file: { data: 'XXX' } },
    {
      ...plainJob,
      file: { data: 'BAZ' },
      assetTag: 'baz',
    },
  ];
  const response = {
    jobs,
    results: [
      {
        ...msgResult,
        body: { id: '111111111' },
      },
      msgResult,
      {
        ...msgResult,
        body: { id: '222222222' },
      },
      {
        ...msgResult,
        body: { id: '333333333' },
      },
      {
        ...msgResult,
        body: { id: '444444444' },
      },
    ],
  };
  const next = moxy(async () => response as never);
  const context = { hello: 'droid' };

  await expect(
    saveUploadedMedia(manager)(context as never, next),
  ).resolves.toEqual(response);

  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith(context);

  expect(manager.saveMedia).toHaveBeenCalledTimes(3);
  expect(manager.saveMedia).toHaveBeenNthCalledWith(
    1,
    agent,
    'foo',
    '111111111',
  );
  expect(manager.saveMedia).toHaveBeenNthCalledWith(
    2,
    agent,
    'bar',
    '222222222',
  );
  expect(manager.saveMedia).toHaveBeenNthCalledWith(
    3,
    agent,
    'baz',
    '444444444',
  );
});

it('save created assets when partial success', async () => {
  const jobs = [
    {
      ...plainJob,
      file: { data: 'FOO' },
      assetTag: 'foo',
    },
    { ...plainJob },
    {
      ...plainJob,
      file: { data: 'BAR' },
      assetTag: 'bar',
    },
    { ...plainJob, file: { data: 'XXX' } },
    {
      ...plainJob,
      file: { data: 'BAZ' },
      assetTag: 'baz',
    },
  ];
  const results = [
    {
      ...msgResult,
      body: { id: '111111111' },
    },
    msgResult,
    {
      ...msgResult,
      body: { id: '222222222' },
    },
    {
      ...msgResult,
      body: { id: '333333333' },
    },
    undefined,
  ];
  const error = new DispatchError(
    [new Error('foo'), new Error('bar')],
    [],
    jobs,
    results,
  );

  const next = moxy(async () => {
    throw error;
  });
  const context = { hello: 'droid' };

  await expect(
    saveUploadedMedia(manager)(context as never, next),
  ).rejects.toThrowError(error);

  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith(context);

  expect(manager.saveMedia).toHaveBeenCalledTimes(2);
  expect(manager.saveMedia).toHaveBeenNthCalledWith(
    1,
    agent,
    'foo',
    '111111111',
  );
  expect(manager.saveMedia).toHaveBeenNthCalledWith(
    2,
    agent,
    'bar',
    '222222222',
  );
});
