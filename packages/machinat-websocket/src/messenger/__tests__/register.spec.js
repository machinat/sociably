import moxy from 'moxy';
import registerChatExtension from '../register';

const nextTick = () => new Promise(process.nextTick);

global.window = moxy();
global.MessengerExtensions = moxy({
  getContext: () => {},
});

beforeEach(() => {
  global.window.mock.reset();
  global.MessengerExtensions.mock.reset();
});

it('throw if appId not rpovided', () => {
  expect(() => registerChatExtension()).toThrowErrorMatchingInlineSnapshot(
    `"appId is required to retrieve chat context"`
  );
  expect(() => registerChatExtension({})).toThrowErrorMatchingInlineSnapshot(
    `"appId is required to retrieve chat context"`
  );
});

it('work', async () => {
  const registerThunk = registerChatExtension({
    appId: 'APP_ID',
    isExtensionReady: true,
  });

  const promise = registerThunk();

  const getContextMock = global.MessengerExtensions.getContext.mock;
  expect(getContextMock).toHaveBeenCalledTimes(1);
  expect(getContextMock).toHaveBeenCalledWith(
    'APP_ID',
    expect.any(Function),
    expect.any(Function)
  );

  const [, resolve] = getContextMock.calls[0].args;
  const chatContext = {
    thread_type: 'GROUP',
    tid: '1411911565550430',
    psid: '1293479104029354',
    signed_request:
      '5f8i9XXH2hEaykXHKFvu-E5Nr6QRqN002JO7yl-w_9o.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
  };
  resolve(chatContext);

  await expect(promise).resolves.toEqual({
    type: 'messenger_chat_extension',
    signedRequest: chatContext.signed_request,
  });
});

it('throw if getContext fail', async () => {
  const registerThunk = registerChatExtension({
    appId: 'APP_ID',
    isExtensionReady: true,
  });

  const promise = registerThunk();

  const getContextMock = global.MessengerExtensions.getContext.mock;
  expect(getContextMock).toHaveBeenCalledTimes(1);

  const [, , reject] = getContextMock.calls[0].args;
  reject(new Error('somthing wrong!'));

  await expect(promise).rejects.toThrowError(new Error('somthing wrong!'));
});

it('wait for extAsyncInit if isExtensionReady set to false', async () => {
  const registerThunk = registerChatExtension({ appId: 'APP_ID' });

  expect(global.window.mock.setter('extAsyncInit')).toHaveBeenCalledTimes(1);
  const init = global.window.mock.setter('extAsyncInit').calls[0].args[0];

  const promise = registerThunk();

  const getContextMock = global.MessengerExtensions.getContext.mock;
  expect(getContextMock).not.toHaveBeenCalled();

  init();
  await nextTick();

  expect(getContextMock).toHaveBeenCalledTimes(1);
  getContextMock.calls[0].args[1]({
    thread_type: 'GROUP',
    tid: '1411911565550430',
    psid: '1293479104029354',
    signed_request:
      '5f8i9XXH2hEaykXHKFvu-E5Nr6QRqN002JO7yl-w_9o.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
  });

  await expect(promise).resolves.toEqual({
    type: 'messenger_chat_extension',
    signedRequest:
      '5f8i9XXH2hEaykXHKFvu-E5Nr6QRqN002JO7yl-w_9o.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
  });
});

it('wait for extAsyncInit if isExtensionReady set to false', async () => {
  jest.useFakeTimers();

  const registerThunk = registerChatExtension({
    appId: 'APP_ID',
    initTimeout: 1000000,
  });
  expect(global.window.mock.setter('extAsyncInit')).toHaveBeenCalledTimes(1);

  const promise = registerThunk();

  const getContextMock = global.MessengerExtensions.getContext.mock;

  jest.advanceTimersByTime(1000000);
  await nextTick();

  await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
    `"extension initiation timeout"`
  );
  expect(getContextMock).not.toHaveBeenCalled();

  jest.useRealTimers();
});
