import moxy from '@moxyjs/moxy';
import nock from 'nock';
import Queue from '@sociably/core/queue';
import TwitterWorker from '../Worker';
import TwitterChat from '../Chat';
import TweetTarget from '../TweetTarget';

nock.disableNetConnect();
jest.mock('nanoid', () => ({ nanoid: () => '__UNIQUE_NONCE__' }));
const mockDateNow = moxy(() => 1646626057392);
const realDateNow = Date.now;

const delay = (t: number) => new Promise((resolve) => setTimeout(resolve, t));

const appKey = '__APP_KEY__';
const appSecret = '__APP_SECRET__';
const bearerToken = '__BEARER_TOKEN__';

const authorizationSpy = moxy((x) => true);
const twitterApi = nock(`https://api.twitter.com`, {
  reqheaders: {
    'content-type': 'application/json',
    authorization: authorizationSpy,
  },
});

let worker: TwitterWorker;
let queue: Queue<any, any>;

beforeAll(() => {
  Date.now = mockDateNow;
});

afterAll(() => {
  Date.now = realDateNow;
});

const chatThread = new TwitterChat('1111111111', '9876543210');
const chatThread2 = new TwitterChat('2222222222', '3333333333');
const tweetTargetThread = new TweetTarget('1111111111', '9999999999');

const agentSettings = {
  userId: '1111111111',
  accessToken: '__ACCESS_TOKEN__',
  tokenSecret: '__ACCESS_SECRET__',
};

const agentSettings2 = {
  userId: '2222222222',
  accessToken: '__ACCESS_TOKEN_2__',
  tokenSecret: '__ACCESS_SECRET_2__',
};

const agentSettingsAccessor = moxy({
  getChannelSettings: async (agent) =>
    agent.id === '1111111111' ? agentSettings : agentSettings2,
  getChannelSettingsBatch: async (agents) =>
    agents.map((agent) =>
      agent.id === '1111111111' ? agentSettings : agentSettings2
    ),
  listAllChannelSettings: async () => [agentSettings, agentSettings2],
});

beforeEach(() => {
  nock.cleanAll();
  authorizationSpy.mock.clear();

  queue = new Queue();
  worker = new TwitterWorker(agentSettingsAccessor, {
    appKey,
    appSecret,
    bearerToken,
    maxConnections: 99,
  });
});

test('api request', async () => {
  const jobsAndScopes = [
    [
      { target: chatThread, request: { method: 'GET', url: '1.1/foo' } },
      twitterApi.get(`/1.1/foo`).delay(50).reply(200, { data: 1 }),
    ] as const,
    [
      {
        target: chatThread,
        request: {
          method: 'GET',
          url: '2/foo/bar',
          params: { a: 1, b: 2 },
        },
      },
      twitterApi.get(`/2/foo/bar?a=1&b=2`).delay(50).reply(200, { data: 2 }),
    ] as const,
    [
      {
        target: tweetTargetThread,
        request: {
          method: 'GET',
          url: '1.1/bar/baz?f=oo',
          params: { s: 'hello world' },
        },
      },
      twitterApi
        .get(`/1.1/bar/baz?f=oo&s=hello%20world`)
        .delay(50)
        .reply(200, { data: 3 }),
    ] as const,
    [
      {
        target: tweetTargetThread,
        request: { method: 'DELETE', url: '2/bar?z=0', params: { a: 1 } },
      },
      twitterApi.delete(`/2/bar?z=0&a=1`).delay(50).reply(200, { data: 4 }),
    ] as const,
    [
      {
        target: chatThread2,
        request: { method: 'POST', url: '2/baz', params: { a: 1 } },
      },
      twitterApi.post(`/2/baz`, { a: 1 }).delay(50).reply(200, { data: 5 }),
    ] as const,
    [
      {
        target: chatThread2,
        request: {
          method: 'POST',
          url: '2/foo/bar/baz',
          params: { s: 'hello world' },
        },
      },
      twitterApi
        .post(`/2/foo/bar/baz`, { s: 'hello world' })
        .delay(50)
        .reply(200, { data: 6 }),
    ] as const,
    [
      {
        target: chatThread,
        request: { method: 'GET', url: '2/foo', params: { a: 1 } },
        asApplication: true,
      },
      twitterApi.get(`/2/foo?a=1`).delay(50).reply(200, { data: 7 }),
    ] as const,
    [
      {
        target: chatThread,
        request: { method: 'POST', url: '2/bar', params: { a: 1 } },
        asApplication: true,
      },
      twitterApi.post(`/2/bar`, { a: 1 }).delay(50).reply(200, { data: 8 }),
    ] as const,
  ];

  worker.start(queue);

  const jobs = jobsAndScopes.map(([job]) => job);
  const promise = queue.executeJobs(jobs);

  await delay(50);
  for (const [, scope] of jobsAndScopes) {
    expect(scope.isDone()).toBe(true);
  }

  await expect(promise).resolves.toEqual({
    success: true,
    errors: null,
    batch: jobs.map((job, i) => ({
      success: true,
      job,
      result: { code: 200, body: { data: i + 1 }, uploadedMedia: null },
    })),
  });

  expect(authorizationSpy).toBeCalledWith('Bearer __BEARER_TOKEN__');
  expect(
    authorizationSpy.mock.calls
      .map(({ args }) => args[0])
      .filter((header) => header.startsWith('OAuth'))
  ).toMatchSnapshot();
});

it('sequently excute jobs with the same key', async () => {
  const bodySpy = moxy(() => true);
  const msgScope = twitterApi
    .post(/^\/2\/(foo|bar|baz)$/, bodySpy)
    .delay(50)
    .times(9)
    .reply(200, (_, body) => ({ data: body }));

  worker.start(queue);

  const jobs = [
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/foo', params: { n: 1 } },
    },
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/bar', params: { n: 2 } },
    },
    {
      key: 'beta',
      target: tweetTargetThread,
      request: { method: 'POST', url: '2/foo', params: { n: 3 } },
    },
    {
      key: 'beta',
      target: tweetTargetThread,
      request: { method: 'POST', url: '2/bar', params: { n: 4 } },
    },
    {
      key: 'gamma',
      target: chatThread2,
      request: { method: 'POST', url: '2/foo', params: { n: 5 } },
    },
    {
      key: 'gamma',
      target: chatThread2,
      request: { method: 'POST', url: '2/bar', params: { n: 6 } },
    },
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/foo', params: { n: 7 } },
    },
    {
      key: 'beta',
      target: tweetTargetThread,
      request: { method: 'POST', url: '2/baz', params: { n: 8 } },
    },
    {
      key: 'gamma',
      target: chatThread2,
      request: { method: 'POST', url: '2/baz', params: { n: 9 } },
    },
  ];

  const executePromise = queue.executeJobs(jobs);

  await delay(50);
  expect(bodySpy).toHaveBeenCalledTimes(3);
  expect(bodySpy.mock.calls[0].args[0]).toEqual({ n: 1 });
  expect(bodySpy.mock.calls[1].args[0]).toEqual({ n: 3 });
  expect(bodySpy.mock.calls[2].args[0]).toEqual({ n: 5 });

  await delay(50);
  expect(bodySpy).toHaveBeenCalledTimes(6);
  expect(bodySpy.mock.calls[3].args[0]).toEqual({ n: 2 });
  expect(bodySpy.mock.calls[4].args[0]).toEqual({ n: 4 });
  expect(bodySpy.mock.calls[5].args[0]).toEqual({ n: 6 });

  await delay(50);
  expect(bodySpy).toHaveBeenCalledTimes(9);
  expect(bodySpy.mock.calls[6].args[0]).toEqual({ n: 7 });
  expect(bodySpy.mock.calls[7].args[0]).toEqual({ n: 8 });
  expect(bodySpy.mock.calls[8].args[0]).toEqual({ n: 9 });

  expect(msgScope.isDone()).toBe(true);

  const result = await executePromise;
  expect(result.success).toBe(true);
  expect(result.errors).toBe(null);
  expect(result.batch).toEqual(
    jobs.map((job, i) => ({
      success: true,
      result: { code: 200, body: { data: { n: i + 1 } }, uploadedMedia: null },
      job,
    }))
  );

  expect(
    authorizationSpy.mock.calls.map(({ args }) => args[0])
  ).toMatchSnapshot();
});

it('open requests up to maxConnections', async () => {
  const poorWorker = new TwitterWorker(agentSettingsAccessor, {
    appKey,
    appSecret,
    bearerToken,
    maxConnections: 2,
  });

  const bodySpy = moxy(() => true);
  const msgScope = twitterApi
    .post(/^\/2\/(foo|bar|baz)$/, bodySpy)
    .delay(50)
    .times(9)
    .reply(200, (_, body) => ({ data: body }));

  poorWorker.start(queue);

  const jobs = [
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/foo', params: { n: 1 } },
    },
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/bar', params: { n: 2 } },
    },
    {
      key: 'beta',
      target: tweetTargetThread,
      request: { method: 'POST', url: '2/foo', params: { n: 3 } },
    },
    {
      key: 'beta',
      target: tweetTargetThread,
      request: { method: 'POST', url: '2/bar', params: { n: 4 } },
    },
    {
      key: 'gamma',
      target: chatThread2,
      request: { method: 'POST', url: '2/foo', params: { n: 5 } },
    },
    {
      key: 'gamma',
      target: chatThread2,
      request: { method: 'POST', url: '2/bar', params: { n: 6 } },
    },
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/foo', params: { n: 7 } },
    },
    {
      key: 'beta',
      target: tweetTargetThread,
      request: { method: 'POST', url: '2/baz', params: { n: 8 } },
    },
    {
      key: 'gamma',
      target: chatThread2,
      request: { method: 'POST', url: '2/baz', params: { n: 9 } },
    },
  ];

  const executePromise = queue.executeJobs(jobs);

  await delay(50);
  expect(bodySpy).toHaveBeenCalledTimes(2);
  expect(bodySpy.mock.calls[0].args[0]).toEqual({ n: 1 });
  expect(bodySpy.mock.calls[1].args[0]).toEqual({ n: 3 });

  await delay(50);
  expect(bodySpy).toHaveBeenCalledTimes(4);
  expect(bodySpy.mock.calls[2].args[0]).toEqual({ n: 2 });
  expect(bodySpy.mock.calls[3].args[0]).toEqual({ n: 4 });

  await delay(50);
  expect(bodySpy).toHaveBeenCalledTimes(6);
  expect(bodySpy.mock.calls[4].args[0]).toEqual({ n: 5 });
  expect(bodySpy.mock.calls[5].args[0]).toEqual({ n: 7 });

  await delay(50);
  expect(bodySpy).toHaveBeenCalledTimes(8);
  expect(bodySpy.mock.calls[6].args[0]).toEqual({ n: 6 });
  expect(bodySpy.mock.calls[7].args[0]).toEqual({ n: 8 });

  await delay(50);
  expect(bodySpy).toHaveBeenCalledTimes(9);
  expect(bodySpy.mock.calls[8].args[0]).toEqual({ n: 9 });

  expect(msgScope.isDone()).toBe(true);
  const result = await executePromise;

  expect(result.success).toBe(true);
  expect(result.errors).toBe(null);
  expect(result.batch).toEqual(
    jobs.map((job, i) => ({
      success: true,
      result: { code: 200, body: { data: { n: i + 1 } }, uploadedMedia: null },
      job,
    }))
  );

  expect(
    authorizationSpy.mock.calls.map(({ args }) => args[0])
  ).toMatchSnapshot();
});

it('throw if agent settings not found', async () => {
  agentSettingsAccessor.getChannelSettings.mock.wrap(
    (impl) => (channel) =>
      channel.id === chatThread2.agentId ? null : impl(channel)
  );
  const apiCall = twitterApi.post('/2/foo').reply(200, { data: { n: 1 } });

  worker.start(queue);

  const jobs = [
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/foo', params: { text: 'hi' } },
    },
    {
      key: 'beta',
      target: chatThread2,
      request: { method: 'POST', url: '2/bar', params: { text: 'good' } },
    },
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/foo', params: { text: 'bye' } },
    },
  ];

  const result = await queue.executeJobs(jobs);
  expect(result.success).toBe(false);
  expect(result.errors).toMatchInlineSnapshot(`
    Array [
      [Error: agent user "2222222222" not registered],
    ]
  `);
  expect(result.batch).toEqual([
    {
      success: true,
      result: { code: 200, body: { data: { n: 1 } }, uploadedMedia: null },
      job: jobs[0],
    },
    undefined,
    undefined,
  ]);

  expect(apiCall.isDone()).toBe(true);
});

it('throw if connection error happen', async () => {
  const scope1 = twitterApi.post('/2/foo').reply(200, { data: { n: 1 } });
  const scope2 = twitterApi
    .post('/2/bar')
    .replyWithError('something wrong like connection error');

  worker.start(queue);

  const jobs = [
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/foo', params: { text: 'hi' } },
    },
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/bar', params: { text: 'good' } },
    },
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/foo', params: { text: 'bye' } },
    },
  ];

  const result = await queue.executeJobs(jobs);
  expect(result.success).toBe(false);
  expect(result.errors).toMatchInlineSnapshot(`
    Array [
      [FetchError: request to https://api.twitter.com/2/bar failed, reason: something wrong like connection error],
    ]
  `);
  expect(result.batch).toEqual([
    {
      success: true,
      result: { code: 200, body: { data: { n: 1 } }, uploadedMedia: null },
      job: jobs[0],
    },
    undefined,
    undefined,
  ]);

  expect(scope1.isDone()).toBe(true);
  expect(scope2.isDone()).toBe(true);
});

it('throw if api error happen', async () => {
  const scope1 = twitterApi.post('/2/foo').reply(200, { data: { n: 1 } });
  const scope2 = twitterApi.post('/2/bar').reply(400, {
    errors: [
      {
        code: 222,
        message: 'something is wrong',
      },
    ],
  });

  const jobs = [
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/foo', params: { text: 'hi' } },
    },
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/bar', params: { text: 'good' } },
    },
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/foo', params: { text: 'bye' } },
    },
  ];

  worker.start(queue);
  const result = await queue.executeJobs(jobs);

  expect(result.success).toBe(false);
  expect(result.errors).toMatchInlineSnapshot(`
    Array [
      [TwitterApiError (Bad Request): something is wrong],
    ]
  `);
  expect(result.batch).toEqual([
    {
      success: true,
      result: { code: 200, body: { data: { n: 1 } }, uploadedMedia: null },
      job: jobs[0],
    },
    undefined,
    undefined,
  ]);

  expect(scope1.isDone()).toBe(true);
  expect(scope2.isDone()).toBe(true);
});

test('with target & accomplishRequest', async () => {
  const accomplishRequest = moxy((target, request) => ({
    ...request,
    params: { ...request.params, target: target.uid },
  }));

  const bodySpy = moxy(() => true);
  const scope = twitterApi
    .post('/2/foo', bodySpy)
    .times(3)
    .delay(50)
    .reply(200, (_, body) => body);

  const jobs = [
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/foo', params: { n: 1 } },
      accomplishRequest,
    },
    {
      key: 'alpha',
      target: chatThread,
      request: { method: 'POST', url: '2/foo', params: { n: 2 } },
      accomplishRequest,
    },
    {
      key: 'beta',
      target: tweetTargetThread,
      request: { method: 'POST', url: '2/foo', params: { n: 3 } },
      accomplishRequest,
    },
  ];

  worker.start(queue);
  await expect(queue.executeJobs(jobs)).resolves.toEqual({
    success: true,
    batch: [
      {
        success: true,
        result: {
          code: 200,
          body: { n: 1, target: chatThread.uid },
          uploadedMedia: null,
        },
        job: jobs[0],
      },
      {
        success: true,
        result: {
          code: 200,
          body: { n: 2, target: chatThread.uid },
          uploadedMedia: null,
        },
        job: jobs[1],
      },
      {
        success: true,
        result: {
          code: 200,
          body: { n: 3, target: tweetTargetThread.uid },
          uploadedMedia: null,
        },
        job: jobs[2],
      },
    ],
    errors: null,
  });

  expect(accomplishRequest).toHaveBeenCalledTimes(3);
  expect(accomplishRequest.mock.calls.map(({ args }) => args)).toEqual([
    [chatThread, jobs[0].request, null],
    [tweetTargetThread, jobs[2].request, null],
    [chatThread, jobs[1].request, null],
  ]);

  expect(scope.isDone()).toBe(true);
});

test('with target & refreshTarget & accomplishRequest', async () => {
  const accomplishRequest = moxy((target, request) => ({
    ...request,
    params: { ...request.params, id: target.tweetId },
  }));
  const refreshTarget = moxy(
    (target, body) => new TweetTarget(target.agentId, body.id)
  );

  const bodySpy = moxy(() => true);
  const scope = twitterApi
    .post('/2/foo', bodySpy)
    .times(8)
    .delay(50)
    .reply(200, (_, body: Record<string, number>) => ({
      n: body.n,
      id: `${Number(body.id) + 1}`,
    }));

  const initialThread1 = new TweetTarget('123456790', '1000000000');
  const initialThread2 = new TweetTarget('123456790', '2000000000');

  const jobs = [
    {
      key: 'alpha',
      target: initialThread1,
      refreshTarget,
      accomplishRequest,
      request: { method: 'POST', url: '2/foo', params: { n: 1 } },
    },
    {
      key: 'alpha',
      target: initialThread1,
      refreshTarget,
      accomplishRequest,
      request: { method: 'POST', url: '2/foo', params: { n: 2 } },
    },
    {
      key: 'beta',
      target: initialThread2,
      refreshTarget,
      accomplishRequest,
      request: { method: 'POST', url: '2/foo', params: { n: 3 } },
    },
    {
      key: 'beta',
      target: initialThread2,
      refreshTarget,
      accomplishRequest,
      request: { method: 'POST', url: '2/foo', params: { n: 4 } },
    },
  ];

  worker.start(queue);
  await expect(queue.executeJobs(jobs)).resolves.toEqual({
    success: true,
    batch: [
      {
        success: true,
        result: {
          code: 200,
          body: { n: 1, id: '1000000001' },
          uploadedMedia: null,
        },
        job: jobs[0],
      },
      {
        success: true,
        result: {
          code: 200,
          body: { n: 2, id: '1000000002' },
          uploadedMedia: null,
        },
        job: jobs[1],
      },
      {
        success: true,
        result: {
          code: 200,
          body: { n: 3, id: '2000000001' },
          uploadedMedia: null,
        },
        job: jobs[2],
      },
      {
        success: true,
        result: {
          code: 200,
          body: { n: 4, id: '2000000002' },
          uploadedMedia: null,
        },
        job: jobs[3],
      },
    ],
    errors: null,
  });

  expect(refreshTarget).toHaveBeenCalledTimes(4);
  expect(accomplishRequest).toHaveBeenCalledTimes(4);
  expect(refreshTarget).toHaveBeenNthCalledWith(1, initialThread1, {
    id: '1000000001',
    n: 1,
  });
  expect(refreshTarget).toHaveBeenNthCalledWith(2, initialThread2, {
    id: '2000000001',
    n: 3,
  });
  expect(refreshTarget).toHaveBeenNthCalledWith(
    3,
    new TweetTarget('123456790', '1000000001'),
    { id: '1000000002', n: 2 }
  );
  expect(refreshTarget).toHaveBeenNthCalledWith(
    4,
    new TweetTarget('123456790', '2000000001'),
    { id: '2000000002', n: 4 }
  );
  expect(accomplishRequest.mock.calls.map(({ args }) => args[0])).toEqual([
    initialThread1,
    initialThread2,
    new TweetTarget('123456790', '1000000001'),
    new TweetTarget('123456790', '2000000001'),
  ]);

  // reset target if refreshTarget return null
  refreshTarget.mock.fakeReturnValue(null);

  await expect(queue.executeJobs(jobs)).resolves.toEqual({
    success: true,
    batch: [
      {
        success: true,
        result: {
          code: 200,
          body: { n: 1, id: '1000000003' },
          uploadedMedia: null,
        },
        job: jobs[0],
      },
      {
        success: true,
        result: {
          code: 200,
          body: { n: 2, id: '1000000001' },
          uploadedMedia: null,
        },
        job: jobs[1],
      },
      {
        success: true,
        result: {
          code: 200,
          body: { n: 3, id: '2000000003' },
          uploadedMedia: null,
        },
        job: jobs[2],
      },
      {
        success: true,
        result: {
          code: 200,
          body: { n: 4, id: '2000000001' },
          uploadedMedia: null,
        },
        job: jobs[3],
      },
    ],
    errors: null,
  });
  expect(refreshTarget.mock.calls.slice(4).map(({ args }) => args)).toEqual([
    [new TweetTarget('123456790', '1000000002'), { n: 1, id: '1000000003' }],
    [new TweetTarget('123456790', '2000000002'), { n: 3, id: '2000000003' }],
    [initialThread1, { n: 2, id: '1000000001' }],
    [initialThread2, { n: 4, id: '2000000001' }],
  ]);
  expect(
    accomplishRequest.mock.calls.slice(4).map(({ args }) => args[0])
  ).toEqual([
    new TweetTarget('123456790', '1000000002'),
    new TweetTarget('123456790', '2000000002'),
    initialThread1,
    initialThread2,
  ]);

  expect(scope.isDone()).toBe(true);
});

test('with mediaSources & accomplishRequest', async () => {
  const uploadBodySpy = moxy(() => true);
  let initMediaCount = 1;
  const uploadCall = nock('https://upload.twitter.com', {
    reqheaders: {
      'content-type': /^multipart\/form-data; boundary=-+[0-9]+/,
      authorization: authorizationSpy,
    },
  })
    .post('/1.1/media/upload.json', uploadBodySpy)
    .times(9)
    .delay(50)
    .reply(
      200,
      (_, body) => {
        const id =
          body.indexOf('INIT') !== -1
            ? new Array(18).fill(`${++initMediaCount}`).join('') // eslint-disable-line no-plusplus
            : /(1{18}|2{18}|3{18}|4{18})/.exec(body as string)?.[0];
        return `{"media_id":${id},"media_id_string":"${id}"}`;
      },
      { 'content-type': 'application/json' }
    );

  const apiBodySpy = moxy(() => true);
  const apiCall = twitterApi
    .post('/2/foo', apiBodySpy)
    .times(2)
    .delay(50)
    .reply(200, (_, body) => body);

  const externalMediaFileCall = nock('https://cat.io')
    .get('/cute')
    .times(2)
    .delay(50)
    .reply(200, '__FILE_CONTENT_FROM_EXTERNAL_URL__', {
      'content-type': 'image/jpg',
      'content-length': '34',
    });

  const accomplishRequest = moxy((_, request, mediaIds) => ({
    ...request,
    params: { ...request.params, media: mediaIds },
  }));

  const jobs = [
    {
      key: 'alpha',
      target: chatThread,
      accomplishRequest,
      request: { method: 'POST', url: '2/foo', params: { n: 1 } },
      mediaSources: [
        { type: 'id', id: '111111111111111111' },
        {
          type: 'file',
          params: { total_bytes: 11, media_type: 'image/png' },
          fileData: Buffer.from('hello media'),
          fileInfo: { contentType: 'image/png', knownLength: 11 },
          assetTag: 'foo',
        },
        {
          type: 'url',
          params: {},
          url: 'https://cat.io/cute',
          assetTag: 'bar',
        },
      ],
    },
    {
      key: 'beta',
      target: tweetTargetThread,
      accomplishRequest,
      request: { method: 'POST', url: '2/foo', params: { n: 2 } },
      mediaSources: [
        {
          type: 'url',
          params: {
            total_bytes: 66,
            media_type: 'video/mp4',
            media_category: 'dm_video',
          },
          url: 'https://cat.io/cute',
          assetTag: 'baz',
        },
      ],
    },
  ];

  worker.start(queue);
  await expect(queue.executeJobs(jobs)).resolves.toEqual({
    success: true,
    batch: [
      {
        success: true,
        result: {
          code: 200,
          body: {
            n: 1,
            media: [
              '111111111111111111',
              '222222222222222222',
              '333333333333333333',
            ],
          },
          uploadedMedia: [
            {
              source: jobs[0].mediaSources[1],
              assetTag: 'foo',
              result: {
                media_id: BigInt('222222222222222222'),
                media_id_string: '222222222222222222',
              },
            },
            {
              source: jobs[0].mediaSources[2],
              assetTag: 'bar',
              result: {
                media_id: BigInt('333333333333333333'),
                media_id_string: '333333333333333333',
              },
            },
          ],
        },
        job: jobs[0],
      },
      {
        success: true,
        result: {
          code: 200,
          body: { n: 2, media: ['444444444444444444'] },
          uploadedMedia: [
            {
              source: jobs[1].mediaSources[0],
              assetTag: 'baz',
              result: {
                media_id: BigInt('444444444444444444'),
                media_id_string: '444444444444444444',
              },
            },
          ],
        },
        job: jobs[1],
      },
    ],
    errors: null,
  });

  expect(accomplishRequest).toHaveBeenCalledTimes(2);
  expect(accomplishRequest).toHaveBeenCalledWith(chatThread, jobs[0].request, [
    '111111111111111111',
    '222222222222222222',
    '333333333333333333',
  ]);
  expect(accomplishRequest).toHaveBeenCalledWith(
    tweetTargetThread,
    jobs[1].request,
    ['444444444444444444']
  );

  expect(
    uploadBodySpy.mock.calls.map(({ args }) =>
      args[0].replace(/-{10}[0-9]+/g, 'BOUNDARY-PLACEHOLDER')
    )
  ).toMatchSnapshot();

  expect(authorizationSpy).toHaveBeenCalledTimes(11);
  expect(
    authorizationSpy.mock.calls.map(({ args }) => args[0])
  ).toMatchSnapshot();

  expect(uploadCall.isDone()).toBe(true);
  expect(apiCall.isDone()).toBe(true);
  expect(externalMediaFileCall.isDone()).toBe(true);
});
