import moxy from '@moxyjs/moxy';
import nock from 'nock';
import Queue from '@machinat/core/queue';
import LineWorker from '../worker';

nock.disableNetConnect();

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

const accessToken = '__LINE_CHANNEL_TOKEN__';

let lineAPI;
let queue;
beforeEach(() => {
  lineAPI = nock('https://api.line.me', {
    reqheaders: {
      'content-type': 'application/json',
      authorization: 'Bearer __LINE_CHANNEL_TOKEN__',
    },
  });

  queue = new Queue();
});

it('makes calls to api', async () => {
  const client = new LineWorker(accessToken, 10);

  const apiAssertions = [
    lineAPI.post('/foo/1', { id: 1 }).delay(100).reply(200, { id: 1 }),
    lineAPI.post('/bar/1', { id: 2 }).delay(100).reply(200, { id: 2 }),
    lineAPI.post('/baz/1', { id: 3 }).delay(100).reply(200, { id: 3 }),
    lineAPI.post('/foo/2', { id: 4 }).delay(100).reply(200, { id: 4 }),
    lineAPI.post('/bar/2', { id: 5 }).delay(100).reply(200, { id: 5 }),
    lineAPI.post('/baz/2', { id: 6 }).delay(100).reply(200, { id: 6 }),
  ];

  client.start(queue);

  const jobs = [
    { method: 'POST', path: 'foo/1', body: { id: 1 }, executionKey: undefined },
    { method: 'POST', path: 'bar/1', body: { id: 2 }, executionKey: undefined },
    { method: 'POST', path: 'baz/1', body: { id: 3 }, executionKey: undefined },
    { method: 'POST', path: 'foo/2', body: { id: 4 }, executionKey: undefined },
    { method: 'POST', path: 'bar/2', body: { id: 5 }, executionKey: undefined },
    { method: 'POST', path: 'baz/2', body: { id: 6 }, executionKey: undefined },
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
});

it('throw if connection error happen', async () => {
  const client = new LineWorker(accessToken, 10);

  const scope1 = lineAPI.post('/v2/bot/message/push').reply(200, {});
  const scope2 = lineAPI
    .post('/v2/bot/message/push')
    .replyWithError('something wrong like connection error');

  client.start(queue);

  await expect(
    queue.executeJobs([
      {
        method: 'POST',
        path: 'v2/bot/message/push',
        body: { id: 1 },
        executionKey: 'foo',
      },
      {
        method: 'POST',
        path: 'v2/bot/message/push',
        body: { id: 2 },
        executionKey: 'foo',
      },
      {
        method: 'POST',
        path: 'v2/bot/message/push',
        body: { id: 3 },
        executionKey: 'foo',
      },
    ])
  ).resolves.toMatchSnapshot();

  expect(scope1.isDone()).toBe(true);
  expect(scope2.isDone()).toBe(true);
});

it('throw if api error happen', async () => {
  const client = new LineWorker(accessToken, 10);

  const scope1 = lineAPI.post('/v2/bot/message/push').reply(200, {});
  const scope2 = lineAPI.post('/v2/bot/message/push').reply(400, {
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
        path: 'v2/bot/message/push',
        body: { id: 1 },
        executionKey: 'foo',
      },
      {
        method: 'POST',
        path: 'v2/bot/message/push',
        body: { id: 2 },
        executionKey: 'foo',
      },
      {
        method: 'POST',
        path: 'v2/bot/message/push',
        body: { id: 3 },
        executionKey: 'foo',
      },
    ])
  ).resolves.toMatchSnapshot();

  expect(scope1.isDone()).toBe(true);
  expect(scope2.isDone()).toBe(true);
});

it('sequently excute jobs within the same identical channel', async () => {
  const client = new LineWorker(accessToken, 10);

  const bodySpy = moxy(() => true);
  const msgScope = lineAPI
    .post(/^\/v2\/bot\/message/, bodySpy)
    .delay(100)
    .times(9)
    .reply(200, '{}');

  client.start(queue);

  const executePromise = queue.executeJobs([
    {
      method: 'POST',
      path: 'v2/bot/message/push',
      executionKey: 'foo',
      body: { id: 1 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/push',
      executionKey: 'foo',
      body: { id: 2 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/push',
      executionKey: 'bar',
      body: { id: 3 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/reply',
      executionKey: 'bar',
      body: { id: 4 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/reply',
      executionKey: 'baz',
      body: { id: 5 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/reply',
      executionKey: 'baz',
      body: { id: 6 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/push',
      executionKey: 'foo',
      body: { id: 7 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/push',
      executionKey: 'bar',
      body: { id: 8 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/push',
      executionKey: 'baz',
      body: { id: 9 },
    },
  ]);

  for (let i = 1; i <= 3; i += 1) {
    await delay(100); // eslint-disable-line no-await-in-loop

    if (i === 1) {
      expect(bodySpy.mock).toHaveBeenCalledTimes(3);
      expect(bodySpy.mock.calls[0].args[0]).toEqual({ id: 1 });
      expect(bodySpy.mock.calls[1].args[0]).toEqual({ id: 3 });
      expect(bodySpy.mock.calls[2].args[0]).toEqual({ id: 5 });
    } else if (i === 2) {
      expect(bodySpy.mock).toHaveBeenCalledTimes(6);
      expect(bodySpy.mock.calls[3].args[0]).toEqual({ id: 2 });
      expect(bodySpy.mock.calls[4].args[0]).toEqual({ id: 4 });
      expect(bodySpy.mock.calls[5].args[0]).toEqual({ id: 6 });
    } else if (i === 3) {
      expect(bodySpy.mock).toHaveBeenCalledTimes(9);
      expect(bodySpy.mock.calls[6].args[0]).toEqual({ id: 7 });
      expect(bodySpy.mock.calls[7].args[0]).toEqual({ id: 8 });
      expect(bodySpy.mock.calls[8].args[0]).toEqual({ id: 9 });
    }
  }

  expect(msgScope.isDone()).toBe(true);
  await expect(executePromise).resolves.toMatchSnapshot();
});

it('open requests up to connectionCapicity', async () => {
  const client = new LineWorker(accessToken, 2);

  const bodySpy = moxy(() => true);
  const msgScope = lineAPI
    .post(/^\/v2\/bot\/message/, bodySpy)
    .delay(100)
    .times(9)
    .reply(200, '{}');

  client.start(queue);

  const executePromise = queue.executeJobs([
    {
      method: 'POST',
      path: 'v2/bot/message/push',
      executionKey: 'foo',
      body: { id: 1 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/push',
      executionKey: 'foo',
      body: { id: 2 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/push',
      executionKey: 'bar',
      body: { id: 3 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/reply',
      executionKey: 'bar',
      body: { id: 4 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/reply',
      executionKey: 'baz',
      body: { id: 5 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/reply',
      executionKey: 'baz',
      body: { id: 6 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/push',
      executionKey: 'foo',
      body: { id: 7 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/push',
      executionKey: 'bar',
      body: { id: 8 },
    },
    {
      method: 'POST',
      path: 'v2/bot/message/push',
      executionKey: 'baz',
      body: { id: 9 },
    },
  ]);

  for (let i = 1; i <= 5; i += 1) {
    await delay(100); // eslint-disable-line no-await-in-loop

    if (i === 1) {
      expect(bodySpy.mock).toHaveBeenCalledTimes(2);
      expect(bodySpy.mock.calls[0].args[0]).toEqual({ id: 1 });
      expect(bodySpy.mock.calls[1].args[0]).toEqual({ id: 3 });
    } else if (i === 2) {
      expect(bodySpy.mock).toHaveBeenCalledTimes(4);
      expect(bodySpy.mock.calls[2].args[0]).toEqual({ id: 2 });
      expect(bodySpy.mock.calls[3].args[0]).toEqual({ id: 4 });
    } else if (i === 3) {
      expect(bodySpy.mock).toHaveBeenCalledTimes(6);
      expect(bodySpy.mock.calls[4].args[0]).toEqual({ id: 5 });
      expect(bodySpy.mock.calls[5].args[0]).toEqual({ id: 7 });
    } else if (i === 4) {
      expect(bodySpy.mock).toHaveBeenCalledTimes(8);
      expect(bodySpy.mock.calls[6].args[0]).toEqual({ id: 6 });
      expect(bodySpy.mock.calls[7].args[0]).toEqual({ id: 8 });
    } else if (i === 5) {
      expect(bodySpy.mock).toHaveBeenCalledTimes(9);
      expect(bodySpy.mock.calls[8].args[0]).toEqual({ id: 9 });
    }
  }

  expect(msgScope.isDone()).toBe(true);
  await expect(executePromise).resolves.toMatchSnapshot();
});
