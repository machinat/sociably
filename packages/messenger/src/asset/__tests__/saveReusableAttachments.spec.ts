import moxy from '@moxyjs/moxy';
import saveReusableAttachments from '../saveReusableAttachments';

const registry = moxy({
  saveAttachment: async () => {},
});

beforeEach(() => {
  registry.mock.clear();
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
      { attachmentAssetTag: 'foo', request: {} },
      { request: {} },
      { attachmentAssetTag: 'bar', request: {} },
      { request: {} },
      { attachmentAssetTag: 'baz', request: {} },
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
  const next = moxy(async () => response);
  const context = { hello: 'droid' };

  await expect(
    saveReusableAttachments(registry)(context as any, next)
  ).resolves.toEqual(response);

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith(context);

  expect(registry.saveAttachment.mock).toHaveBeenCalledTimes(3);
  expect(registry.saveAttachment.mock).toHaveBeenNthCalledWith(
    1,
    'foo',
    '_ATTACHMENT_1_'
  );
  expect(registry.saveAttachment.mock).toHaveBeenNthCalledWith(
    2,
    'bar',
    '_ATTACHMENT_2_'
  );
  expect(registry.saveAttachment.mock).toHaveBeenNthCalledWith(
    3,
    'baz',
    '_ATTACHMENT_3_'
  );
});
