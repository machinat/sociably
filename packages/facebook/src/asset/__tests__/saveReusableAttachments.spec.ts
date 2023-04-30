import moxy from '@moxyjs/moxy';
import { DispatchError } from '@sociably/core/engine';
import FacebookPage from '../../Page';
import FacebookChat from '../../Chat';
import saveReusableAttachments from '../saveReusableAttachments';
import AssetsManager from '../AssetsManager';

const manager = moxy<AssetsManager>({
  saveAttachment: async () => {},
} as never);

beforeEach(() => {
  manager.mock.clear();
});

const page = new FacebookPage('12345');
const chat = new FacebookChat('12345', { id: '67890' });

const plainJob = { channel: page, request: { method: 'GET', url: 'foo' } };

const jobWithFileAndAssetTag = (assetTag?: string) => ({
  channel: page,
  request: { method: 'POST', url: 'foo' },
  file: { data: '__FILE_DATA__', assetTag },
});

const apiResult = {
  code: 200,
  headers: {},
  body: { recepient_id: 'xxx', message_id: 'xxx' },
};

it('do nothing when job has no assetTag', async () => {
  const jobs = [plainJob, plainJob, plainJob];
  const tasks = [{ type: 'dispatch' as const, payload: jobs }];
  const response = { jobs, tasks, results: [apiResult, apiResult, apiResult] };
  const context = { platform: 'facebook', target: chat, tasks, node: null };
  const next = moxy(async () => response);

  await expect(
    saveReusableAttachments(manager)(context, next)
  ).resolves.toEqual(response);

  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith(context);

  expect(manager.saveAttachment).not.toHaveBeenCalled();
});

it('save attachment id created with send api', async () => {
  const jobs = [
    plainJob,
    jobWithFileAndAssetTag('foo'),
    plainJob,
    jobWithFileAndAssetTag('bar'),
    plainJob,
    jobWithFileAndAssetTag('baz'),
  ];
  const response = {
    jobs,
    results: [
      apiResult,
      {
        ...apiResult,
        body: { ...apiResult.body, attachment_id: '_ATTACHMENT_1_' },
      },
      apiResult,
      {
        ...apiResult,
        body: { ...apiResult.body, attachment_id: '_ATTACHMENT_2_' },
      },
      apiResult,
      {
        ...apiResult,
        body: { ...apiResult.body, attachment_id: '_ATTACHMENT_3_' },
      },
    ],
  };
  const next = moxy(async () => response as never);
  const context = { hello: 'droid' };

  await expect(
    saveReusableAttachments(manager)(context as never, next)
  ).resolves.toEqual(response);

  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith(context);

  expect(manager.saveAttachment).toHaveBeenCalledTimes(3);
  expect(manager.saveAttachment).toHaveBeenNthCalledWith(
    1,
    page,
    'foo',
    '_ATTACHMENT_1_'
  );
  expect(manager.saveAttachment).toHaveBeenNthCalledWith(
    2,
    page,
    'bar',
    '_ATTACHMENT_2_'
  );
  expect(manager.saveAttachment).toHaveBeenNthCalledWith(
    3,
    page,
    'baz',
    '_ATTACHMENT_3_'
  );
});

it('save attachment id when partial success', async () => {
  const error = new DispatchError(
    [new Error('foo'), new Error('bar')],
    [],
    [
      jobWithFileAndAssetTag('foo'),
      plainJob,
      jobWithFileAndAssetTag('bar'),
      plainJob,
      jobWithFileAndAssetTag('baz'),
    ],
    [
      {
        ...apiResult,
        body: { ...apiResult.body, attachment_id: '_ATTACHMENT_1_' },
      },
      apiResult,
      {
        ...apiResult,
        body: { ...apiResult.body, attachment_id: '_ATTACHMENT_2_' },
      },
      undefined,
      undefined,
    ]
  );

  const next = moxy(async () => {
    throw error;
  });
  const context = { hello: 'droid' };

  await expect(
    saveReusableAttachments(manager)(context as never, next)
  ).rejects.toThrowError(error);

  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith(context);

  expect(manager.saveAttachment).toHaveBeenCalledTimes(2);
  expect(manager.saveAttachment).toHaveBeenNthCalledWith(
    1,
    page,
    'foo',
    '_ATTACHMENT_1_'
  );
  expect(manager.saveAttachment).toHaveBeenNthCalledWith(
    2,
    page,
    'bar',
    '_ATTACHMENT_2_'
  );
});
