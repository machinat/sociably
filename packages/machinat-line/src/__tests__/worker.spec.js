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
    { method: 'POST', entry: 'foo/1', body: { id: 1 }, channelUid: '_CHAN_' },
    { method: 'POST', entry: 'bar/1', body: { id: 2 }, channelUid: '_CHAN_' },
    { method: 'POST', entry: 'baz/1', body: { id: 3 }, channelUid: '_CHAN_' },
    { method: 'POST', entry: 'foo/2', body: { id: 4 }, channelUid: '_CHAN_' },
    { method: 'POST', entry: 'bar/2', body: { id: 5 }, channelUid: '_CHAN_' },
    { method: 'POST', entry: 'baz/2', body: { id: 6 }, channelUid: '_CHAN_' },
  ];

  await expect(queue.executeJobs(jobs)).resolves.toEqual({
    success: true,
    errors: null,
    batch: jobs.map(job => ({ success: true, job, result: {} })),
  });

  expect(pathSpy.mock.calls.map(c => c.args[0])).toEqual(
    jobs.map(j => `/${j.entry}`)
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
      {
        method: 'POST',
        entry: 'v2/bot/message/push',
        body: { id: 1 },
        channelUid: 'foo',
      },
      {
        method: 'POST',
        entry: 'v2/bot/message/push',
        body: { id: 2 },
        channelUid: 'foo',
      },
      {
        method: 'POST',
        entry: 'v2/bot/message/push',
        body: { id: 3 },
        channelUid: 'foo',
      },
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
      {
        method: 'POST',
        entry: 'v2/bot/message/push',
        body: { id: 1 },
        channelUid: 'foo',
      },
      {
        method: 'POST',
        entry: 'v2/bot/message/push',
        body: { id: 2 },
        channelUid: 'foo',
      },
      {
        method: 'POST',
        entry: 'v2/bot/message/push',
        body: { id: 3 },
        channelUid: 'foo',
      },
    ])
  ).resolves.toMatchSnapshot();

  expect(scope1.isDone()).toBe(true);
  expect(scope2.isDone()).toBe(true);
});

it('sequently excute jobs of the identical channel', async () => {
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
      {
        method: 'POST',
        entry: 'v2/bot/message/push',
        channelUid: 'foo',
        body: { id: 1 },
      },
      {
        method: 'POST',
        entry: 'v2/bot/message/push',
        channelUid: 'bar',
        body: { id: 2 },
      },
      {
        method: 'POST',
        entry: 'v2/bot/message/push',
        channelUid: 'baz',
        body: { id: 3 },
      },
      {
        method: 'POST',
        entry: 'v2/bot/message/reply',
        channelUid: 'foo',
        body: { id: 4 },
      },
      {
        method: 'POST',
        entry: 'v2/bot/message/reply',
        channelUid: 'bar',
        body: { id: 5 },
      },
      {
        method: 'POST',
        entry: 'v2/bot/message/reply',
        channelUid: 'baz',
        body: { id: 6 },
      },
      {
        method: 'POST',
        entry: 'v2/bot/message/push',
        channelUid: 'foo',
        body: { id: 7 },
      },
      {
        method: 'POST',
        entry: 'v2/bot/message/push',
        channelUid: 'bar',
        body: { id: 8 },
      },
      {
        method: 'POST',
        entry: 'v2/bot/message/push',
        channelUid: 'baz',
        body: { id: 9 },
      },
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
