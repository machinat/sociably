import moxy from '@moxyjs/moxy';
import collectSharableAttachments from '../collectSharableAttachments';

const registry = moxy({
  setAttachmentId: async () => {},
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
    collectSharableAttachments(registry)(context, next)
  ).resolves.toEqual(response);

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith(context);

  expect(registry.setAttachmentId.mock).toHaveBeenCalledTimes(3);
  expect(registry.setAttachmentId.mock).toHaveBeenNthCalledWith(
    1,
    'foo',
    '_ATTACHMENT_1_'
  );
  expect(registry.setAttachmentId.mock).toHaveBeenNthCalledWith(
    2,
    'bar',
    '_ATTACHMENT_2_'
  );
  expect(registry.setAttachmentId.mock).toHaveBeenNthCalledWith(
    3,
    'baz',
    '_ATTACHMENT_3_'
  );
});
