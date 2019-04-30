import moxy from 'moxy';
import nock from 'nock';
import Queue from 'machinat-queue';
import LineWorker from '../worker';

nock.disableNetConnect();

const delay = t => new Promise(resolve => setTimeout(resolve, t));

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

it('makes calls to api ok', async () => {
  const client = new LineWorker({
    accessToken,
    useReplyAPI: false,
    connectionCapicity: 10,
  });

  const pathSpy = moxy(() => true);
  const bodySpy = moxy(() => true);

  const scope = lineAPI
    .post(pathSpy, bodySpy)
    .times(6)
    .reply(200, '{}');

  client.start(queue);

  const jobs = [
    { entry: 'foo/1', body: { id: 1 }, threadUid: '_THREAD_' },
    { entry: 'bar/1', body: { id: 2 }, threadUid: '_THREAD_' },
    { entry: 'baz/1', body: { id: 3 }, threadUid: '_THREAD_' },
    { entry: 'foo/2', body: { id: 4 }, threadUid: '_THREAD_' },
    { entry: 'bar/2', body: { id: 5 }, threadUid: '_THREAD_' },
    { entry: 'baz/2', body: { id: 6 }, threadUid: '_THREAD_' },
  ];

  await expect(queue.executeJobs(jobs)).resolves.toEqual({
    success: true,
    errors: null,
    batch: jobs.map(job => ({ success: true, job, result: {} })),
  });

  expect(pathSpy.mock.calls.map(c => c.args[0])).toEqual(
    jobs.map(j => `/v2/bot/${j.entry}`)
  );
  expect(bodySpy.mock.calls.map(c => c.args[0])).toEqual(jobs.map(j => j.body));

  expect(scope.isDone()).toBe(true);
});

it('throw if connection error happen', async () => {
  const client = new LineWorker({
    accessToken,
    useReplyAPI: false,
    connectionCapicity: 10,
  });

  const scope1 = lineAPI.post('/v2/bot/message/push').reply(200, {});
  const scope2 = lineAPI
    .post('/v2/bot/message/push')
    .replyWithError('something wrong like connection error');

  client.start(queue);

  await expect(
    queue.executeJobs([
      { entry: 'message/push', body: { id: 1 }, threadUid: 'foo' },
      { entry: 'message/push', body: { id: 2 }, threadUid: 'foo' },
      { entry: 'message/push', body: { id: 3 }, threadUid: 'foo' },
    ])
  ).resolves.toMatchSnapshot();

  expect(scope1.isDone()).toBe(true);
  expect(scope2.isDone()).toBe(true);
});

it('throw if api error happen', async () => {
  const client = new LineWorker({
    accessToken,
    useReplyAPI: false,
    connectionCapicity: 10,
  });

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
      { entry: 'message/push', body: { id: 1 }, threadUid: 'foo' },
      { entry: 'message/push', body: { id: 2 }, threadUid: 'foo' },
      { entry: 'message/push', body: { id: 3 }, threadUid: 'foo' },
    ])
  ).resolves.toMatchSnapshot();

  expect(scope1.isDone()).toBe(true);
  expect(scope2.isDone()).toBe(true);
});

it('sequently excute jobs of the identical thread', async () => {
  const client = new LineWorker({
    accessToken,
    useReplyAPI: false,
    connectionCapicity: 10,
  });

  const bodySpy = moxy(() => true);
  const msgScope = lineAPI
    .post(/^\/v2\/bot\/message/, bodySpy)
    .delay(100)
    .times(9)
    .reply(200, '{}');

  client.start(queue);

  const promise = expect(
    queue.executeJobs([
      { entry: 'message/push', threadUid: 'foo', body: { id: 1 } },
      { entry: 'message/push', threadUid: 'bar', body: { id: 2 } },
      { entry: 'message/push', threadUid: 'baz', body: { id: 3 } },
      { entry: 'message/reply', threadUid: 'foo', body: { id: 4 } },
      { entry: 'message/reply', threadUid: 'bar', body: { id: 5 } },
      { entry: 'message/reply', threadUid: 'baz', body: { id: 6 } },
      { entry: 'message/push', threadUid: 'foo', body: { id: 7 } },
      { entry: 'message/push', threadUid: 'bar', body: { id: 8 } },
      { entry: 'message/push', threadUid: 'baz', body: { id: 9 } },
    ])
  ).resolves.toMatchSnapshot();

  for (let i = 0; i < 3; i += 1) {
    await delay(100); // eslint-disable-line no-await-in-loop
    expect(bodySpy.mock).toHaveBeenCalledTimes(3 * i + 3);

    expect(bodySpy.mock.calls[3 * i].args[0]).toEqual({ id: 3 * i + 1 });
    expect(bodySpy.mock.calls[3 * i + 1].args[0]).toEqual({ id: 3 * i + 2 });
    expect(bodySpy.mock.calls[3 * i + 2].args[0]).toEqual({ id: 3 * i + 3 });
  }

  expect(msgScope.isDone()).toBe(true);
  await promise;
});
