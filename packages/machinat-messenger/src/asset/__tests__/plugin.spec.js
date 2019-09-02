import moxy from 'moxy';
import messengerAssetsPlugin from '../plugin';
import MessengerAssetsRepository from '../repository';

jest.mock('../repository', () =>
  jest.requireActual('moxy').default(function MockRepository() {
    this.setAsset = async () => true;
  })
);

const store = moxy();
const bot = moxy();

beforeEach(() => {
  MessengerAssetsRepository.mock.clear();
});

it('attach repository to event frame', async () => {
  const next = moxy(async () => ({ foo: 'bar' }));
  const frame = { hello: 'droid' };

  await expect(
    messengerAssetsPlugin(store)(bot).eventMiddleware(next)(frame)
  ).resolves.toEqual({ foo: 'bar' });

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith({
    hello: 'droid',
    assets: expect.any(MessengerAssetsRepository),
  });

  expect(MessengerAssetsRepository.mock).toHaveBeenCalledTimes(1);
  expect(MessengerAssetsRepository.mock).toHaveBeenCalledWith(store, bot);

  expect(next.mock.calls[0].args[0].assets).toBe(
    MessengerAssetsRepository.mock.calls[0].instance
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

  expect(MessengerAssetsRepository.mock).toHaveBeenCalledTimes(1);
  const repository = MessengerAssetsRepository.mock.calls[0].instance;

  expect(repository.setAsset.mock).toHaveBeenCalledTimes(3);
  expect(repository.setAsset.mock).toHaveBeenNthCalledWith(
    1,
    'attachment',
    'foo',
    '_ATTACHMENT_1_'
  );
  expect(repository.setAsset.mock).toHaveBeenNthCalledWith(
    2,
    'attachment',
    'bar',
    '_ATTACHMENT_2_'
  );
  expect(repository.setAsset.mock).toHaveBeenNthCalledWith(
    3,
    'attachment',
    'baz',
    '_ATTACHMENT_3_'
  );
});
