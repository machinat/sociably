import moxy from '@moxyjs/moxy';
import { DispatchError } from '@sociably/core/engine';
import saveReusableAttachments from '../saveReusableAttachments';
import AssetsManager from '../AssetsManager';

const manager = moxy<AssetsManager>({
  saveAttachment: async () => {},
} as never);

beforeEach(() => {
  manager.mock.clear();
});

it('do nothing when job has no assetTag', async () => {
  const msgResult = { code: 200, headers: {}, body: {} };
  const response = {
    jobs: [
      { request: { ...{} } },
      { request: { ...{} } },
      { request: { ...{} } },
    ],
    results: [msgResult, msgResult, msgResult],
  };
  const next = moxy(async () => response as never);
  const context = { hello: 'droid' };

  await expect(
    saveReusableAttachments(manager)(context as any, next)
  ).resolves.toEqual(response);

  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith(context);

  expect(manager.saveAttachment).not.toHaveBeenCalled();
});

it('save attachment id created with send api', async () => {
  const apiResult = {
    code: 200,
    headers: {},
    body: { recepient_id: 'xxx', message_id: 'xxx' },
  };
  const response = {
    jobs: [
      { request: {} },
      { assetTag: 'foo', request: {} },
      { request: {} },
      { assetTag: 'bar', request: {} },
      { request: {} },
      { assetTag: 'baz', request: {} },
    ],
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
    'foo',
    '_ATTACHMENT_1_'
  );
  expect(manager.saveAttachment).toHaveBeenNthCalledWith(
    2,
    'bar',
    '_ATTACHMENT_2_'
  );
  expect(manager.saveAttachment).toHaveBeenNthCalledWith(
    3,
    'baz',
    '_ATTACHMENT_3_'
  );
});

it('save attachment id when partial success', async () => {
  const apiResult = {
    code: 200,
    headers: {},
    body: { recepient_id: 'xxx', message_id: 'xxx' },
  };
  const error = new DispatchError(
    [new Error('foo'), new Error('bar')],
    [],
    [
      { assetTag: 'foo', request: {} },
      { request: {} },
      { assetTag: 'bar', request: {} },
      { request: {} },
      { assetTag: 'baz', request: {} },
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
    'foo',
    '_ATTACHMENT_1_'
  );
  expect(manager.saveAttachment).toHaveBeenNthCalledWith(
    2,
    'bar',
    '_ATTACHMENT_2_'
  );
});
