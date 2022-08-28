import moxy from '@moxyjs/moxy';
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

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith(context);

  expect(manager.saveAttachment.mock).not.toHaveBeenCalled();
});

it('register asset created within send api', async () => {
  const _result = {
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
      _result,
      {
        ..._result,
        body: { ..._result.body, attachment_id: '_ATTACHMENT_1_' },
      },
      _result,
      {
        ..._result,
        body: { ..._result.body, attachment_id: '_ATTACHMENT_2_' },
      },
      _result,
      {
        ..._result,
        body: { ..._result.body, attachment_id: '_ATTACHMENT_3_' },
      },
    ],
  };
  const next = moxy(async () => response as never);
  const context = { hello: 'droid' };

  await expect(
    saveReusableAttachments(manager)(context as any, next)
  ).resolves.toEqual(response);

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith(context);

  expect(manager.saveAttachment.mock).toHaveBeenCalledTimes(3);
  expect(manager.saveAttachment.mock).toHaveBeenNthCalledWith(
    1,
    'foo',
    '_ATTACHMENT_1_'
  );
  expect(manager.saveAttachment.mock).toHaveBeenNthCalledWith(
    2,
    'bar',
    '_ATTACHMENT_2_'
  );
  expect(manager.saveAttachment.mock).toHaveBeenNthCalledWith(
    3,
    'baz',
    '_ATTACHMENT_3_'
  );
});
