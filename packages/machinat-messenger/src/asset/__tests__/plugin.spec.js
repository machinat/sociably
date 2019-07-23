import moxy from 'moxy';
import messengerAssetsPlugin from '../plugin';
import MessengerAssetManager from '../manager';

jest.mock('../manager', () =>
  jest.requireActual('moxy').default(function MockAccessor() {
    this.setAsset = async () => true;
  })
);

const store = moxy();
const bot = moxy();

beforeEach(() => {
  MessengerAssetManager.mock.clear();
});

it('attach accessor to event frame', async () => {
  const next = moxy(async () => ({ foo: 'bar' }));
  const frame = { hello: 'droid' };

  await expect(
    messengerAssetsPlugin(store)(bot).eventMiddleware(next)(frame)
  ).resolves.toEqual({ foo: 'bar' });

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith({
    hello: 'droid',
    assets: expect.any(MessengerAssetManager),
  });

  expect(MessengerAssetManager.mock).toHaveBeenCalledTimes(1);
  expect(MessengerAssetManager.mock).toHaveBeenCalledWith(store, bot);

  expect(next.mock.calls[0].args[0].assets).toBe(
    MessengerAssetManager.mock.calls[0].instance
  );
});

it('store asset created within send api', async () => {
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
  const frame = { hello: 'human' };

  await expect(
    messengerAssetsPlugin(store)(bot).dispatchMiddleware(next)(frame)
  ).resolves.toEqual(response);

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith(frame);

  expect(MessengerAssetManager.mock).toHaveBeenCalledTimes(1);
  const accessor = MessengerAssetManager.mock.calls[0].instance;

  expect(accessor.setAsset.mock).toHaveBeenCalledTimes(3);
  expect(accessor.setAsset.mock).toHaveBeenNthCalledWith(
    1,
    'attachment',
    'foo',
    '_ATTACHMENT_1_'
  );
  expect(accessor.setAsset.mock).toHaveBeenNthCalledWith(
    2,
    'attachment',
    'bar',
    '_ATTACHMENT_2_'
  );
  expect(accessor.setAsset.mock).toHaveBeenNthCalledWith(
    3,
    'attachment',
    'baz',
    '_ATTACHMENT_3_'
  );
});
