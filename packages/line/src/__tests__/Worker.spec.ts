import moxy from '@moxyjs/moxy';
import nock from 'nock';
import Queue from '@sociably/core/queue';
import LineChannel from '../Channel';
import LineWorker from '../Worker';

nock.disableNetConnect();

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

const channelSettingsAccessor = moxy({
  getChannelSettings: async (channel: LineChannel) => ({
    channelId: `__CHANNEL_ID_${channel.id}__`,
    providerId: '__PROVIDER_ID__',
    accessToken: `__ACCESS_TOKEN_${channel.id}__`,
    channelSecret: `__CHANNEL_SECRET_${channel.id}__`,
  }),
  getChannelSettingsBatch: async () => [],
  listAllChannelSettings: async () => [],
  getLineChatChannelSettingsByBotUserId: async () => null,
  getLineLoginChannelSettings: async () => null,
});

const authorizationHeaderSpy = moxy(() => true);

let lineApi;
let queue;
beforeEach(() => {
  lineApi = nock('https://api.line.me', {
    reqheaders: {
      'content-type': 'application/json',
      authorization: authorizationHeaderSpy,
    },
  });

  queue = new Queue();

  authorizationHeaderSpy.mock.clear();
  channelSettingsAccessor.mock.reset();
});

it('makes calls to api', async () => {
  const client = new LineWorker(channelSettingsAccessor, 10);

  const apiAssertions = [
    lineApi.get('/foo/1?id=1').delay(100).reply(200, { id: 1 }),
    lineApi.post('/bar/1', { id: 2 }).delay(100).reply(200, { id: 2 }),
    lineApi.put('/baz/1', { id: 3 }).delay(100).reply(200, { id: 3 }),
    lineApi.post('/foo/2', { id: 4 }).delay(100).reply(200, { id: 4 }),
    lineApi.delete('/bar/2?id=5').delay(100).reply(200, { id: 5 }),
    lineApi.post('/baz/2', { id: 6 }).delay(100).reply(200, { id: 6 }),
  ];

  client.start(queue);

  const jobs = [
    {
      method: 'GET',
      url: 'foo/1',
      params: { id: 1 },
      chatChannelId: '1',
    },
    {
      method: 'POST',
      url: 'bar/1',
      params: { id: 2 },
      chatChannelId: '1',
    },
    {
      method: 'PUT',
      url: 'baz/1',
      params: { id: 3 },
      chatChannelId: '1',
    },
    {
      method: 'POST',
      url: 'foo/2',
      params: { id: 4 },
      chatChannelId: '2',
    },
    {
      method: 'DELETE',
      url: 'bar/2',
      params: { id: 5 },
      chatChannelId: '2',
    },
    {
      method: 'POST',
      url: 'baz/2',
      params: { id: 6 },
      chatChannelId: '3',
    },
  ];

  const promise = queue.executeJobs(jobs);

  await delay(100);
  for (const scope of apiAssertions) {
    expect(scope.isDone()).toBe(true);
  }

  await expect(promise).resolves.toEqual({
    success: true,
    errors: null,
    batch: jobs.map((job, i) => ({
      success: true,
      job,
      result: {
        code: 200,
        headers: { 'content-type': 'application/json' },
        body: { id: i + 1 },
      },
    })),
  });

  expect(channelSettingsAccessor.getChannelSettings).toHaveBeenCalledTimes(6);

  jobs.forEach(({ chatChannelId }, i) => {
    expect(channelSettingsAccessor.getChannelSettings).toHaveBeenNthCalledWith(
      i + 1,
      new LineChannel(chatChannelId)
    );
    expect(authorizationHeaderSpy).toHaveBeenNthCalledWith(
      i + 1,
      `Bearer __ACCESS_TOKEN_${chatChannelId}__`
    );
  });
});

it('fail if unable to get channel setting', async () => {
  const client = new LineWorker(channelSettingsAccessor, 10);

  const scope = lineApi.post('/v2/bot/message/push').reply(200, {});

  channelSettingsAccessor.getChannelSettings.mock.fake(async (channel) =>
    channel.id === '1'
      ? null
      : { accessToken: `__ACCESS_TOKEN_${channel.id}__` }
  );

  client.start(queue);

  const promise = expect(
    queue.executeJobs([
      {
        method: 'POST',
        url: 'v2/bot/message/push',
        params: { id: 1 },
        key: 'foo',
        chatChannelId: '1',
      },
      {
        method: 'POST',
        url: 'v2/bot/message/push',
        params: { id: 2 },
        key: 'foo',
        chatChannelId: '1',
      },
      {
        method: 'POST',
        url: 'v2/bot/message/push',
        params: { id: 2 },
        key: 'bar',
        chatChannelId: '2',
      },
      {
        method: 'POST',
        url: 'v2/bot/message/push',
        params: { id: 3 },
        key: 'baz',
        chatChannelId: '1',
      },
    ])
  ).resolves.toMatchInlineSnapshot(`
                    Object {
                      "batch": Array [
                        undefined,
                        undefined,
                        Object {
                          "error": undefined,
                          "job": Object {
                            "chatChannelId": "2",
                            "key": "bar",
                            "method": "POST",
                            "params": Object {
                              "id": 2,
                            },
                            "url": "v2/bot/message/push",
                          },
                          "result": Object {
                            "body": Object {},
                            "code": 200,
                            "headers": Object {
                              "content-type": "application/json",
                            },
                          },
                          "success": true,
                        },
                        undefined,
                      ],
                      "errors": Array [
                        [Error: Channel "1" settings not found],
                        [Error: Channel "1" settings not found],
                      ],
                      "success": false,
                    }
                  `);

  await new Promise((r) => setTimeout(r, 1000));

  await promise;

  expect(scope.isDone()).toBe(true);
});

it('fail if connection error happen', async () => {
  const client = new LineWorker(channelSettingsAccessor, 10);

  const scope1 = lineApi.post('/v2/bot/message/push').reply(200, {});
  const scope2 = lineApi
    .post('/v2/bot/message/push')
    .replyWithError('something wrong like connection error');

  client.start(queue);

  await expect(
    queue.executeJobs([
      {
        method: 'POST',
        url: 'v2/bot/message/push',
        params: { id: 1 },
        key: 'foo',
        chatChannelId: '1',
      },
      {
        method: 'POST',
        url: 'v2/bot/message/push',
        params: { id: 2 },
        key: 'foo',
        chatChannelId: '1',
      },
      {
        method: 'POST',
        url: 'v2/bot/message/push',
        params: { id: 3 },
        key: 'foo',
        chatChannelId: '1',
      },
    ])
  ).resolves.toMatchInlineSnapshot(`
          Object {
            "batch": Array [
              Object {
                "error": undefined,
                "job": Object {
                  "chatChannelId": "1",
                  "key": "foo",
                  "method": "POST",
                  "params": Object {
                    "id": 1,
                  },
                  "url": "v2/bot/message/push",
                },
                "result": Object {
                  "body": Object {},
                  "code": 200,
                  "headers": Object {
                    "content-type": "application/json",
                  },
                },
                "success": true,
              },
              undefined,
              undefined,
            ],
            "errors": Array [
              [FetchError: request to https://api.line.me/v2/bot/message/push failed, reason: something wrong like connection error],
            ],
            "success": false,
          }
        `);

  expect(scope1.isDone()).toBe(true);
  expect(scope2.isDone()).toBe(true);
});

it('fail if api error happen', async () => {
  const client = new LineWorker(channelSettingsAccessor, 10);

  const scope1 = lineApi.post('/v2/bot/message/push').reply(200, {});
  const scope2 = lineApi.post('/v2/bot/message/push').reply(400, {
    message: 'The request body has 2 error(s)',
    details: [
      {
        message: 'May not be empty',
        property: 'messages[0].text',
      },
      {
        message:
          'Must be one of the following values: [text, image, video, audio, location, sticker, template, imagemap]',
        property: 'messages[1].type',
      },
    ],
  });

  client.start(queue);
  await expect(
    queue.executeJobs([
      {
        method: 'POST',
        url: 'v2/bot/message/push',
        params: { id: 1 },
        key: 'foo',
        chatChannelId: '1',
      },
      {
        method: 'POST',
        url: 'v2/bot/message/push',
        params: { id: 2 },
        key: 'foo',
        chatChannelId: '1',
      },
      {
        method: 'POST',
        url: 'v2/bot/message/push',
        params: { id: 3 },
        key: 'foo',
        chatChannelId: '1',
      },
    ])
  ).resolves.toMatchInlineSnapshot(`
          Object {
            "batch": Array [
              Object {
                "error": undefined,
                "job": Object {
                  "chatChannelId": "1",
                  "key": "foo",
                  "method": "POST",
                  "params": Object {
                    "id": 1,
                  },
                  "url": "v2/bot/message/push",
                },
                "result": Object {
                  "body": Object {},
                  "code": 200,
                  "headers": Object {
                    "content-type": "application/json",
                  },
                },
                "success": true,
              },
              undefined,
              undefined,
            ],
            "errors": Array [
              [LineAPIError (Bad Request): The request body has 2 error(s): 1) May not be empty, at messages[0].text. 2) Must be one of the following values: [text, image, video, audio, location, sticker, template, imagemap], at messages[1].type.],
            ],
            "success": false,
          }
        `);

  expect(scope1.isDone()).toBe(true);
  expect(scope2.isDone()).toBe(true);
});

it('sequently excute jobs within an identical thread', async () => {
  const client = new LineWorker(channelSettingsAccessor, 10);

  const bodySpy = moxy(() => true);
  const msgScope = lineApi
    .post(/^\/v2\/bot\/message/, bodySpy)
    .delay(100)
    .times(9)
    .reply(200, '{}');

  client.start(queue);

  const executePromise = queue.executeJobs([
    {
      method: 'POST',
      url: 'v2/bot/message/push',
      key: 'foo',
      params: { id: 1 },
      chatChannelId: '1',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/push',
      key: 'foo',
      params: { id: 2 },
      chatChannelId: '1',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/push',
      key: 'bar',
      params: { id: 3 },
      chatChannelId: '1',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/reply',
      key: 'bar',
      params: { id: 4 },
      chatChannelId: '1',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/reply',
      key: 'baz',
      params: { id: 5 },
      chatChannelId: '2',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/reply',
      key: 'baz',
      params: { id: 6 },
      chatChannelId: '2',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/push',
      key: 'foo',
      params: { id: 7 },
      chatChannelId: '1',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/push',
      key: 'bar',
      params: { id: 8 },
      chatChannelId: '1',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/push',
      key: 'baz',
      params: { id: 9 },
      chatChannelId: '2',
    },
  ]);

  for (let i = 1; i <= 3; i += 1) {
    await delay(100); // eslint-disable-line no-await-in-loop

    if (i === 1) {
      expect(bodySpy).toHaveBeenCalledTimes(3);
      expect(bodySpy.mock.calls[0].args[0]).toEqual({ id: 1 });
      expect(bodySpy.mock.calls[1].args[0]).toEqual({ id: 3 });
      expect(bodySpy.mock.calls[2].args[0]).toEqual({ id: 5 });
    } else if (i === 2) {
      expect(bodySpy).toHaveBeenCalledTimes(6);
      expect(bodySpy.mock.calls[3].args[0]).toEqual({ id: 2 });
      expect(bodySpy.mock.calls[4].args[0]).toEqual({ id: 4 });
      expect(bodySpy.mock.calls[5].args[0]).toEqual({ id: 6 });
    } else if (i === 3) {
      expect(bodySpy).toHaveBeenCalledTimes(9);
      expect(bodySpy.mock.calls[6].args[0]).toEqual({ id: 7 });
      expect(bodySpy.mock.calls[7].args[0]).toEqual({ id: 8 });
      expect(bodySpy.mock.calls[8].args[0]).toEqual({ id: 9 });
    }
  }

  expect(authorizationHeaderSpy).toHaveBeenCalledTimes(9);
  expect(authorizationHeaderSpy.mock.calls.map(({ args }) => args[0])).toEqual([
    'Bearer __ACCESS_TOKEN_1__',
    'Bearer __ACCESS_TOKEN_1__',
    'Bearer __ACCESS_TOKEN_2__',
    'Bearer __ACCESS_TOKEN_1__',
    'Bearer __ACCESS_TOKEN_1__',
    'Bearer __ACCESS_TOKEN_2__',
    'Bearer __ACCESS_TOKEN_1__',
    'Bearer __ACCESS_TOKEN_1__',
    'Bearer __ACCESS_TOKEN_2__',
  ]);

  expect(msgScope.isDone()).toBe(true);
  await expect(executePromise).resolves.toMatchSnapshot();
});

it('open requests up to maxConnections', async () => {
  const client = new LineWorker(channelSettingsAccessor, 2);

  const bodySpy = moxy(() => true);
  const msgScope = lineApi
    .post(/^\/v2\/bot\/message/, bodySpy)
    .delay(100)
    .times(9)
    .reply(200, '{}');

  client.start(queue);

  const executePromise = queue.executeJobs([
    {
      method: 'POST',
      url: 'v2/bot/message/push',
      key: 'foo',
      params: { id: 1 },
      chatChannelId: '1',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/push',
      key: 'foo',
      params: { id: 2 },
      chatChannelId: '1',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/push',
      key: 'bar',
      params: { id: 3 },
      chatChannelId: '1',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/reply',
      key: 'bar',
      params: { id: 4 },
      chatChannelId: '1',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/reply',
      key: 'baz',
      params: { id: 5 },
      chatChannelId: '2',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/reply',
      key: 'baz',
      params: { id: 6 },
      chatChannelId: '2',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/push',
      key: 'foo',
      params: { id: 7 },
      chatChannelId: '1',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/push',
      key: 'bar',
      params: { id: 8 },
      chatChannelId: '1',
    },
    {
      method: 'POST',
      url: 'v2/bot/message/push',
      key: 'baz',
      params: { id: 9 },
      chatChannelId: '2',
    },
  ]);

  for (let i = 1; i <= 5; i += 1) {
    await delay(100); // eslint-disable-line no-await-in-loop

    if (i === 1) {
      expect(bodySpy).toHaveBeenCalledTimes(2);
      expect(bodySpy.mock.calls[0].args[0]).toEqual({ id: 1 });
      expect(bodySpy.mock.calls[1].args[0]).toEqual({ id: 3 });
    } else if (i === 2) {
      expect(bodySpy).toHaveBeenCalledTimes(4);
      expect(bodySpy.mock.calls[2].args[0]).toEqual({ id: 2 });
      expect(bodySpy.mock.calls[3].args[0]).toEqual({ id: 4 });
    } else if (i === 3) {
      expect(bodySpy).toHaveBeenCalledTimes(6);
      expect(bodySpy.mock.calls[4].args[0]).toEqual({ id: 5 });
      expect(bodySpy.mock.calls[5].args[0]).toEqual({ id: 7 });
    } else if (i === 4) {
      expect(bodySpy).toHaveBeenCalledTimes(8);
      expect(bodySpy.mock.calls[6].args[0]).toEqual({ id: 6 });
      expect(bodySpy.mock.calls[7].args[0]).toEqual({ id: 8 });
    } else if (i === 5) {
      expect(bodySpy).toHaveBeenCalledTimes(9);
      expect(bodySpy.mock.calls[8].args[0]).toEqual({ id: 9 });
    }
  }

  expect(msgScope.isDone()).toBe(true);
  await expect(executePromise).resolves.toMatchSnapshot();
});
