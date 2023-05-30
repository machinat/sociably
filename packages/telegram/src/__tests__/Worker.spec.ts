import { moxy } from '@moxyjs/moxy';
import nock from 'nock';
import Queue from '@sociably/core/queue';
import TelegramUser from '../User.js';
import TelegramWorker from '../Worker.js';

nock.disableNetConnect();

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

const botId1 = 1111111;
const botId2 = 2222222;
const botToken1 = '1111111:_BOT_TOKEN_';
const botToken2 = '2222222:_BOT_TOKEN_';

const agentSettingsAccessor = moxy({
  getAgentSettings: async (botUser) => ({
    botToken: botUser.id === botId1 ? botToken1 : botToken2,
    botName: 'MyBot',
    secretToken: '_SECRET_TOKEN_',
  }),
  getAgentSettingsBatch: async () => [],
});

const telegramApi = nock(`https://api.telegram.org`, {
  reqheaders: { 'content-type': 'application/json' },
});
let queue: Queue<any, any>;
beforeEach(() => {
  queue = new Queue();
  nock.cleanAll();
  agentSettingsAccessor.mock.reset();
});

it('makes calls to api', async () => {
  const client = new TelegramWorker(agentSettingsAccessor, 10);

  const apiCalls = [
    telegramApi
      .post(`/bot${botToken1}/foo`, { n: 1 })
      .delay(100)
      .reply(200, { ok: true, result: { n: 1 } }),
    telegramApi
      .post(`/bot${botToken1}/bar`, { n: 2 })
      .delay(100)
      .reply(200, { ok: true, result: { n: 2 } }),
    telegramApi
      .post(`/bot${botToken2}/baz`, { n: 3 })
      .delay(100)
      .reply(200, { ok: true, result: { n: 3 } }),
    telegramApi
      .post(`/bot${botToken2}/foo`, { n: 4 })
      .delay(100)
      .reply(200, { ok: true, result: { n: 4 } }),
    telegramApi
      .post(`/bot${botToken1}/bar`, { n: 5 })
      .delay(100)
      .reply(200, { ok: true, result: { n: 5 } }),
    telegramApi
      .post(`/bot${botToken2}/baz`, { n: 6 })
      .delay(100)
      .reply(200, { ok: true, result: { n: 6 } }),
  ];

  client.start(queue);

  const jobs = [
    { agentId: botId1, method: 'foo', params: { n: 1 }, key: undefined },
    { agentId: botId1, method: 'bar', params: { n: 2 }, key: undefined },
    { agentId: botId2, method: 'baz', params: { n: 3 }, key: undefined },
    { agentId: botId2, method: 'foo', params: { n: 4 }, key: undefined },
    { agentId: botId1, method: 'bar', params: { n: 5 }, key: undefined },
    { agentId: botId2, method: 'baz', params: { n: 6 }, key: undefined },
  ];

  const promise = queue.executeJobs(jobs);

  await delay(100);
  for (const apiCall of apiCalls) {
    expect(apiCall.isDone()).toBe(true);
  }

  await expect(promise).resolves.toEqual({
    success: true,
    errors: null,
    batch: jobs.map((job, i) => ({
      success: true,
      job,
      result: { ok: true, result: { n: i + 1 } },
    })),
  });

  expect(agentSettingsAccessor.getAgentSettings).toHaveBeenCalledTimes(6);
  expect(agentSettingsAccessor.getAgentSettings).toHaveBeenCalledWith(
    new TelegramUser(botId1, true)
  );
  expect(agentSettingsAccessor.getAgentSettings).toHaveBeenCalledWith(
    new TelegramUser(botId2, true)
  );
});

it('sequently excute jobs within the same identical chat', async () => {
  const client = new TelegramWorker(agentSettingsAccessor, 10);

  const bodySpy = moxy(() => true);
  const bot1ApiCalls = telegramApi
    .post(new RegExp(`^/bot${botToken1}/send(Photo|Message)$`), bodySpy)
    .delay(100)
    .times(6)
    .reply(200, (_, body) => ({ ok: true, result: body }));
  const bot2ApiCalls = telegramApi
    .post(new RegExp(`^/bot${botToken2}/send(Photo|Message)$`), bodySpy)
    .delay(100)
    .times(3)
    .reply(200, (_, body) => ({ ok: true, result: body }));

  client.start(queue);

  const jobs = [
    { agentId: botId1, method: 'sendMessage', key: 'foo', params: { n: 1 } },
    { agentId: botId1, method: 'sendPhoto', key: 'foo', params: { n: 2 } },
    { agentId: botId1, method: 'sendMessage', key: 'bar', params: { n: 3 } },
    { agentId: botId1, method: 'sendPhoto', key: 'bar', params: { n: 4 } },
    { agentId: botId2, method: 'sendMessage', key: 'baz', params: { n: 5 } },
    { agentId: botId2, method: 'sendPhoto', key: 'baz', params: { n: 6 } },
    { agentId: botId1, method: 'sendMessage', key: 'foo', params: { n: 7 } },
    { agentId: botId1, method: 'sendMessage', key: 'bar', params: { n: 8 } },
    { agentId: botId2, method: 'sendMessage', key: 'baz', params: { n: 9 } },
  ];

  const executePromise = queue.executeJobs(jobs);

  await delay(100);
  expect(bodySpy).toHaveBeenCalledTimes(3);
  expect(bodySpy.mock.calls[0].args[0]).toEqual({ n: 1 });
  expect(bodySpy.mock.calls[1].args[0]).toEqual({ n: 3 });
  expect(bodySpy.mock.calls[2].args[0]).toEqual({ n: 5 });

  await delay(100);
  expect(bodySpy).toHaveBeenCalledTimes(6);
  expect(bodySpy.mock.calls[3].args[0]).toEqual({ n: 2 });
  expect(bodySpy.mock.calls[4].args[0]).toEqual({ n: 4 });
  expect(bodySpy.mock.calls[5].args[0]).toEqual({ n: 6 });

  await delay(100);
  expect(bodySpy).toHaveBeenCalledTimes(9);
  expect(bodySpy.mock.calls[6].args[0]).toEqual({ n: 7 });
  expect(bodySpy.mock.calls[7].args[0]).toEqual({ n: 8 });
  expect(bodySpy.mock.calls[8].args[0]).toEqual({ n: 9 });

  expect(bot1ApiCalls.isDone()).toBe(true);
  expect(bot2ApiCalls.isDone()).toBe(true);

  const result = await executePromise;
  expect(result.success).toBe(true);
  expect(result.errors).toBe(null);
  expect(result.batch).toEqual(
    jobs.map((job, i) => ({
      success: true,
      result: { ok: true, result: { n: i + 1 } },
      job,
    }))
  );
});

it('open requests up to maxConnections', async () => {
  const client = new TelegramWorker(agentSettingsAccessor, 2);

  const bodySpy = moxy(() => true);
  const bot1ApiCall = telegramApi
    .post(new RegExp(`^/bot${botToken1}/send(Photo|Message)$`), bodySpy)
    .delay(100)
    .times(6)
    .reply(200, (_, body) => ({ ok: true, result: body }));
  const bot2ApiCall = telegramApi
    .post(new RegExp(`^/bot${botToken2}/send(Photo|Message)$`), bodySpy)
    .delay(100)
    .times(3)
    .reply(200, (_, body) => ({ ok: true, result: body }));

  client.start(queue);

  const jobs = [
    { agentId: botId1, method: 'sendMessage', key: 'foo', params: { n: 1 } },
    { agentId: botId1, method: 'sendPhoto', key: 'foo', params: { n: 2 } },
    { agentId: botId1, method: 'sendMessage', key: 'bar', params: { n: 3 } },
    { agentId: botId1, method: 'sendPhoto', key: 'bar', params: { n: 4 } },
    { agentId: botId2, method: 'sendMessage', key: 'baz', params: { n: 5 } },
    { agentId: botId2, method: 'sendPhoto', key: 'baz', params: { n: 6 } },
    { agentId: botId1, method: 'sendMessage', key: 'foo', params: { n: 7 } },
    { agentId: botId1, method: 'sendMessage', key: 'bar', params: { n: 8 } },
    { agentId: botId2, method: 'sendMessage', key: 'baz', params: { n: 9 } },
  ];

  const executePromise = queue.executeJobs(jobs);

  await delay(100);
  expect(bodySpy).toHaveBeenCalledTimes(2);
  expect(bodySpy.mock.calls[0].args[0]).toEqual({ n: 1 });
  expect(bodySpy.mock.calls[1].args[0]).toEqual({ n: 3 });

  await delay(100);
  expect(bodySpy).toHaveBeenCalledTimes(4);
  expect(bodySpy.mock.calls[2].args[0]).toEqual({ n: 2 });
  expect(bodySpy.mock.calls[3].args[0]).toEqual({ n: 4 });

  await delay(100);
  expect(bodySpy).toHaveBeenCalledTimes(6);
  expect(bodySpy.mock.calls[4].args[0]).toEqual({ n: 5 });
  expect(bodySpy.mock.calls[5].args[0]).toEqual({ n: 7 });

  await delay(100);
  expect(bodySpy).toHaveBeenCalledTimes(8);
  expect(bodySpy.mock.calls[6].args[0]).toEqual({ n: 6 });
  expect(bodySpy.mock.calls[7].args[0]).toEqual({ n: 8 });

  await delay(100);
  expect(bodySpy).toHaveBeenCalledTimes(9);
  expect(bodySpy.mock.calls[8].args[0]).toEqual({ n: 9 });

  expect(bot1ApiCall.isDone()).toBe(true);
  expect(bot2ApiCall.isDone()).toBe(true);
  const result = await executePromise;

  expect(result.success).toBe(true);
  expect(result.errors).toBe(null);
  expect(result.batch).toEqual(
    jobs.map((job, i) => ({
      success: true,
      result: { ok: true, result: { n: i + 1 } },
      job,
    }))
  );
});

it('throw if connection error happen', async () => {
  const client = new TelegramWorker(agentSettingsAccessor, 10);

  const apiCall1 = telegramApi
    .post(`/bot${botToken1}/sendMessage`)
    .reply(200, { ok: true, result: { n: 1 } });
  const apiCall2 = telegramApi
    .post(`/bot${botToken1}/sendPhoto`)
    .replyWithError('something wrong like connection error');

  client.start(queue);

  const jobs = [
    {
      agentId: botId1,
      method: 'sendMessage',
      params: { text: 'hi' },
      key: 'foo',
    },
    {
      agentId: botId1,
      method: 'sendPhoto',
      params: { file_id: 123 },
      key: 'foo',
    },
    {
      agentId: botId1,
      method: 'sendMessage',
      params: { text: 'bye' },
      key: 'foo',
    },
  ];

  const result = await queue.executeJobs(jobs);
  expect(result.success).toBe(false);
  expect(result.errors).toMatchInlineSnapshot(`
    [
      [FetchError: request to https://api.telegram.org/bot1111111:_BOT_TOKEN_/sendPhoto failed, reason: something wrong like connection error],
    ]
  `);
  expect(result.batch).toEqual([
    {
      success: true,
      result: { ok: true, result: { n: 1 } },
      job: jobs[0],
    },
    undefined,
    undefined,
  ]);

  expect(apiCall1.isDone()).toBe(true);
  expect(apiCall2.isDone()).toBe(true);
});

it('throw if api error happen', async () => {
  const client = new TelegramWorker(agentSettingsAccessor, 10);

  const apiCall1 = telegramApi
    .post(`/bot${botToken1}/sendMessage`)
    .reply(200, { ok: true, result: { n: 1 } });
  const apiCall2 = telegramApi.post(`/bot${botToken1}/sendPhoto`).reply(400, {
    ok: false,
    description: 'error from api',
    error_code: 400,
  });

  const jobs = [
    {
      agentId: botId1,
      method: 'sendMessage',
      params: { text: 'hi' },
      key: 'foo',
    },
    {
      agentId: botId1,
      method: 'sendPhoto',
      params: { file_id: 123 },
      key: 'foo',
    },
    {
      agentId: botId1,
      method: 'sendMessage',
      params: { text: 'bye' },
      key: 'foo',
    },
  ];

  client.start(queue);
  const result = await queue.executeJobs(jobs);

  expect(result.success).toBe(false);
  expect(result.errors).toMatchInlineSnapshot(`
    [
      [TelegramAPIError: (#400) error from api],
    ]
  `);
  expect(result.batch).toEqual([
    {
      success: true,
      result: { ok: true, result: { n: 1 } },
      job: jobs[0],
    },
    undefined,
    undefined,
  ]);

  expect(apiCall1.isDone()).toBe(true);
  expect(apiCall2.isDone()).toBe(true);
});

test('with files', async () => {
  const client = new TelegramWorker(agentSettingsAccessor, 10);
  const bodySpy = moxy(() => true);

  const apiCallWithFile = nock(`https://api.telegram.org`, {
    reqheaders: { 'content-type': /^multipart\/form-data; boundary=-+[0-9]+$/ },
  })
    .post(new RegExp(`^/bot${botToken1}/send(Photo|MediaGroup)$`), bodySpy)
    .times(2)
    .reply(200, { ok: true, result: {} });

  const jobs = [
    {
      agentId: botId1,
      method: 'sendPhoto',
      params: { chat_id: 12345, caption: 'hi photo' },
      key: 'foo',
      files: [
        {
          fieldName: 'photo',
          data: '__PHOTO_CONTENT__',
          assetTag: 'foo',
          info: {
            contentType: 'image/png',
            filename: 'my_photo.png',
          },
        },
      ],
    },
    {
      agentId: botId1,
      method: 'sendMediaGroup',
      params: {
        chat_id: 12345,
        media: [
          { type: 'video', media: 'attach://my_video' },
          { type: 'audio', media: 'attach://my_audio' },
        ],
      },
      key: 'foo',
      files: [
        {
          fieldName: 'my_video',
          data: '__VIDEO_CONTENT__',
          assetTag: 'bar',
        },
        {
          fieldName: 'my_audio',
          data: '__AUDIO_CONTENT__',
          assetTag: 'bar',
        },
      ],
    },
  ];

  client.start(queue);
  await expect(queue.executeJobs(jobs)).resolves.toEqual({
    success: true,
    batch: [
      {
        success: true,
        result: { ok: true, result: {} },
        job: jobs[0],
      },
      {
        success: true,
        result: { ok: true, result: {} },
        job: jobs[1],
      },
    ],
    errors: null,
  });

  expect(bodySpy).toHaveBeenCalledTimes(2);
  expect(
    bodySpy.mock.calls.map(({ args }) =>
      args[0].replace(/-{10}[0-9]+/g, 'BOUNDARY-PLACEHOLDER')
    )
  ).toMatchSnapshot();

  expect(apiCallWithFile.isDone()).toBe(true);
});
