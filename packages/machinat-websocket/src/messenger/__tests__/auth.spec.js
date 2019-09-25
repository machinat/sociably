import moxy from 'moxy';
import authenticateChatExtenstion from '../auth';

const pass = moxy(() => ({ accepted: false }));
const request = {
  url: '/foo',
  type: 'GET',
  headers: {},
};

beforeEach(() => {
  pass.mock.reset();
});

it('throw if appSecret not given', () => {
  expect(() => authenticateChatExtenstion()).toThrowErrorMatchingInlineSnapshot(
    `"appSecret must be provided to verify chat extension context"`
  );
  expect(() =>
    authenticateChatExtenstion({})
  ).toThrowErrorMatchingInlineSnapshot(
    `"appSecret must be provided to verify chat extension context"`
  );
});

it('work', async () => {
  await expect(
    authenticateChatExtenstion({ appSecret: 'APP_SECRET' })(pass)(
      {
        type: 'messenger_chat_extension',
        signedRequest:
          'djtx96RQaNCtszsQ7GOIXy8jBF659cNCBVM69n3g6h8.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
      },
      request
    )
  ).resolves.toEqual({
    accepted: true,
    user: {
      platform: 'messenger',
      id: '1254459154682919',
    },
    tags: ['USER_TO_PAGE'],
    webContext: {
      algorithm: 'HMAC-SHA256',
      issued_at: 1504046380,
      page_id: 682498171943165,
      psid: '1254459154682919',
      thread_type: 'USER_TO_PAGE',
      tid: '1254459154682919',
    },
  });
  expect(pass.mock).not.toHaveBeenCalled();
});

it('pass if auth type is not messenger_chat_extension', async () => {
  await expect(
    authenticateChatExtenstion({ appSecret: 'APP_SECRET' })(pass)(
      { type: 'default' },
      request
    )
  ).resolves.toEqual({ accepted: false });

  expect(pass.mock).toHaveBeenCalledTimes(1);
  expect(pass.mock).toHaveBeenCalledWith({ type: 'default' }, request);

  pass.mock.fake(async () => ({ accepted: true }));
  await expect(
    authenticateChatExtenstion({ appSecret: 'APP_SECRET' })(pass)(
      { type: 'some_other_auth' },
      request
    )
  ).resolves.toEqual({ accepted: true });

  expect(pass.mock).toHaveBeenCalledTimes(2);
  expect(pass.mock).toHaveBeenCalledWith({ type: 'some_other_auth' }, request);
});

it('not accept if "signedRequest" is missing in body', async () => {
  await expect(
    authenticateChatExtenstion({ appSecret: 'APP_SECRET' })(pass)(
      { type: 'messenger_chat_extension' },
      request
    )
  ).resolves.toMatchInlineSnapshot(`
                    Object {
                      "accepted": false,
                      "reason": "signedRequest is empty",
                    }
                `);
  expect(pass.mock).not.toHaveBeenCalled();
});

it('not accept if signature verfication fail', async () => {
  await expect(
    authenticateChatExtenstion({ appSecret: 'APP_SECRET' })(pass)(
      {
        type: 'messenger_chat_extension',
        signedRequest:
          '__invalid_signature_part__.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
      },
      request
    )
  ).resolves.toMatchInlineSnapshot(`
          Object {
            "accepted": false,
            "reason": "signature verification fail",
          }
        `);
  expect(pass.mock).not.toHaveBeenCalled();
});
