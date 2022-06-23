import moxy from '@moxyjs/moxy';
import nock from 'nock';
import Queue from '@sociably/core/queue';
import TwitterWorker from '../Worker';

nock.disableNetConnect();
jest.mock('nanoid', () => ({ nanoid: () => '__UNIQUE_NONCE__' }));
const mockDateNow = moxy(() => 1646626057392);
const realDateNow = Date.now;

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

const appKey = '__APP_KEY__';
const appSecret = '__APP_SECRET__';
const bearerToken = '__BEARER_TOKEN__';
const accessToken = '__ACCESS_TOKEN__';
const accessSecret = '__ACCESS_SECRET__';

const authorizationSpy = moxy(() => true);
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

beforeEach(() => {
  nock.cleanAll();
  authorizationSpy.mock.clear();

  queue = new Queue();
  worker = new TwitterWorker({
    appKey,
    appSecret,
    bearerToken,
    accessToken,
    accessSecret,
    maxConnections: 99,
  });
});

test('api request', async () => {
  const jobsAndScopes = [
    [
      { request: { method: 'GET', href: '1.1/foo' } },
      twitterApi.get(`/1.1/foo`).delay(50).reply(200, { data: 1 }),
    ] as const,
    [
      {
        request: {
          method: 'GET',
          href: '2/foo/bar',
          parameters: { a: 1, b: 2 },
        },
      },
      twitterApi.get(`/2/foo/bar?a=1&b=2`).delay(50).reply(200, { data: 2 }),
    ] as const,
    [
      {
        request: {
          method: 'GET',
          href: '1.1/bar/baz?f=oo',
          parameters: { s: 'hello world' },
        },
      },
      twitterApi
        .get(`/1.1/bar/baz?f=oo&s=hello%20world`)
        .delay(50)
        .reply(200, { data: 3 }),
    ] as const,
    [
      {
        request: { method: 'DELETE', href: '2/bar?z=0', parameters: { a: 1 } },
      },
      twitterApi
        .delete(`/2/bar?z=0`, { a: 1 })
        .delay(50)
        .reply(200, { data: 4 }),
    ] as const,
    [
      { request: { method: 'POST', href: '2/baz', parameters: { a: 1 } } },
      twitterApi.post(`/2/baz`, { a: 1 }).delay(50).reply(200, { data: 5 }),
    ] as const,
    [
      {
        request: {
          method: 'POST',
          href: '2/foo/bar/baz',
          parameters: { s: 'hello world' },
        },
      },
      twitterApi
        .post(`/2/foo/bar/baz`, { s: 'hello world' })
        .delay(50)
        .reply(200, { data: 6 }),
    ] as const,
    [
      {
        request: { method: 'GET', href: '2/foo', parameters: { a: 1 } },
        asApplication: true,
      },
      twitterApi.get(`/2/foo?a=1`).delay(50).reply(200, { data: 7 }),
    ] as const,
    [
      {
        request: { method: 'POST', href: '2/bar', parameters: { a: 1 } },
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

  expect(authorizationSpy.mock).toHaveBeenCalledTimes(8);
  expect(
    authorizationSpy.mock.calls.map(({ args }) => args[0])
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
      request: { method: 'POST', href: '2/foo', parameters: { n: 1 } },
    },
    {
      key: 'alpha',
      request: { method: 'POST', href: '2/bar', parameters: { n: 2 } },
    },
    {
      key: 'beta',
      request: { method: 'POST', href: '2/foo', parameters: { n: 3 } },
    },
    {
      key: 'beta',
      request: { method: 'POST', href: '2/bar', parameters: { n: 4 } },
    },
    {
      key: 'gamma',
      request: { method: 'POST', href: '2/foo', parameters: { n: 5 } },
    },
    {
      key: 'gamma',
      request: { method: 'POST', href: '2/bar', parameters: { n: 6 } },
    },
    {
      key: 'alpha',
      request: { method: 'POST', href: '2/foo', parameters: { n: 7 } },
    },
    {
      key: 'beta',
      request: { method: 'POST', href: '2/baz', parameters: { n: 8 } },
    },
    {
      key: 'gamma',
      request: { method: 'POST', href: '2/baz', parameters: { n: 9 } },
    },
  ];

  const executePromise = queue.executeJobs(jobs);

  await delay(50);
  expect(bodySpy.mock).toHaveBeenCalledTimes(3);
  expect(bodySpy.mock.calls[0].args[0]).toEqual({ n: 1 });
  expect(bodySpy.mock.calls[1].args[0]).toEqual({ n: 3 });
  expect(bodySpy.mock.calls[2].args[0]).toEqual({ n: 5 });

  await delay(50);
  expect(bodySpy.mock).toHaveBeenCalledTimes(6);
  expect(bodySpy.mock.calls[3].args[0]).toEqual({ n: 2 });
  expect(bodySpy.mock.calls[4].args[0]).toEqual({ n: 4 });
  expect(bodySpy.mock.calls[5].args[0]).toEqual({ n: 6 });

  await delay(50);
  expect(bodySpy.mock).toHaveBeenCalledTimes(9);
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
});

it('open requests up to maxConnections', async () => {
  const poorWorker = new TwitterWorker({
    appKey,
    appSecret,
    bearerToken,
    accessToken,
    accessSecret,
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
      request: { method: 'POST', href: '2/foo', parameters: { n: 1 } },
    },
    {
      key: 'alpha',
      request: { method: 'POST', href: '2/bar', parameters: { n: 2 } },
    },
    {
      key: 'beta',
      request: { method: 'POST', href: '2/foo', parameters: { n: 3 } },
    },
    {
      key: 'beta',
      request: { method: 'POST', href: '2/bar', parameters: { n: 4 } },
    },
    {
      key: 'gamma',
      request: { method: 'POST', href: '2/foo', parameters: { n: 5 } },
    },
    {
      key: 'gamma',
      request: { method: 'POST', href: '2/bar', parameters: { n: 6 } },
    },
    {
      key: 'alpha',
      request: { method: 'POST', href: '2/foo', parameters: { n: 7 } },
    },
    {
      key: 'beta',
      request: { method: 'POST', href: '2/baz', parameters: { n: 8 } },
    },
    {
      key: 'gamma',
      request: { method: 'POST', href: '2/baz', parameters: { n: 9 } },
    },
  ];

  const executePromise = queue.executeJobs(jobs);

  await delay(50);
  expect(bodySpy.mock).toHaveBeenCalledTimes(2);
  expect(bodySpy.mock.calls[0].args[0]).toEqual({ n: 1 });
  expect(bodySpy.mock.calls[1].args[0]).toEqual({ n: 3 });

  await delay(50);
  expect(bodySpy.mock).toHaveBeenCalledTimes(4);
  expect(bodySpy.mock.calls[2].args[0]).toEqual({ n: 2 });
  expect(bodySpy.mock.calls[3].args[0]).toEqual({ n: 4 });

  await delay(50);
  expect(bodySpy.mock).toHaveBeenCalledTimes(6);
  expect(bodySpy.mock.calls[4].args[0]).toEqual({ n: 5 });
  expect(bodySpy.mock.calls[5].args[0]).toEqual({ n: 7 });

  await delay(50);
  expect(bodySpy.mock).toHaveBeenCalledTimes(8);
  expect(bodySpy.mock.calls[6].args[0]).toEqual({ n: 6 });
  expect(bodySpy.mock.calls[7].args[0]).toEqual({ n: 8 });

  await delay(50);
  expect(bodySpy.mock).toHaveBeenCalledTimes(9);
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
      request: { method: 'POST', href: '2/foo', parameters: { text: 'hi' } },
    },
    {
      key: 'alpha',
      request: { method: 'POST', href: '2/bar', parameters: { text: 'good' } },
    },
    {
      key: 'alpha',
      request: { method: 'POST', href: '2/foo', parameters: { text: 'bye' } },
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
      request: { method: 'POST', href: '2/foo', parameters: { text: 'hi' } },
    },
    {
      key: 'alpha',
      request: { method: 'POST', href: '2/bar', parameters: { text: 'good' } },
    },
    {
      key: 'alpha',
      request: { method: 'POST', href: '2/foo', parameters: { text: 'bye' } },
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
    parameters: { ...request.parameters, ...target },
  }));

  const bodySpy = moxy(() => true);
  const scope = twitterApi
    .post('/2/foo', bodySpy)
    .times(3)
    .delay(50)
    .reply(200, (_, body) => body);
  const channel1 = { id: '12345' };
  const channel2 = { id: '67890' };

  const jobs = [
    {
      key: 'alpha',
      target: channel1,
      request: { method: 'POST', href: '2/foo', parameters: { n: 1 } },
      accomplishRequest,
    },
    {
      key: 'alpha',
      target: channel1,
      request: { method: 'POST', href: '2/foo', parameters: { n: 2 } },
      accomplishRequest,
    },
    {
      key: 'beta',
      target: channel2,
      request: { method: 'POST', href: '2/foo', parameters: { n: 3 } },
      accomplishRequest,
    },
  ];

  worker.start(queue);
  await expect(queue.executeJobs(jobs)).resolves.toEqual({
    success: true,
    batch: ['12345', '12345', '67890'].map((id, i) => ({
      success: true,
      result: { code: 200, body: { n: i + 1, id }, uploadedMedia: null },
      job: jobs[i],
    })),

    errors: null,
  });

  expect(accomplishRequest.mock).toHaveBeenCalledTimes(3);
  expect(accomplishRequest.mock.calls.map(({ args }) => args)).toEqual([
    [channel1, jobs[0].request, null],
    [channel2, jobs[2].request, null],
    [channel1, jobs[1].request, null],
  ]);

  expect(scope.isDone()).toBe(true);
});

test('with target & refreshTarget & accomplishRequest', async () => {
  const accomplishRequest = moxy((target, request) => ({
    ...request,
    parameters: { ...request.parameters, id: target.id },
  }));
  const refreshTarget = moxy((target, body) => ({ id: body.id }));

  const bodySpy = moxy(() => true);
  const scope = twitterApi
    .post('/2/foo', bodySpy)
    .times(8)
    .delay(50)
    .reply(200, (_, body: Record<string, number>) => ({
      n: body.n,
      id: body.id + 1,
    }));

  const jobs = [
    {
      key: 'alpha',
      target: { id: 1 },
      refreshTarget,
      accomplishRequest,
      request: { method: 'POST', href: '2/foo', parameters: { n: 1 } },
    },
    {
      key: 'alpha',
      target: { id: 1 },
      refreshTarget,
      accomplishRequest,
      request: { method: 'POST', href: '2/foo', parameters: { n: 2 } },
    },
    {
      key: 'beta',
      target: { id: 10 },
      refreshTarget,
      accomplishRequest,
      request: { method: 'POST', href: '2/foo', parameters: { n: 3 } },
    },
    {
      key: 'beta',
      target: { id: 10 },
      refreshTarget,
      accomplishRequest,
      request: { method: 'POST', href: '2/foo', parameters: { n: 4 } },
    },
  ];

  worker.start(queue);
  await expect(queue.executeJobs(jobs)).resolves.toEqual({
    success: true,
    batch: [2, 3, 11, 12].map((id, i) => ({
      success: true,
      result: { code: 200, body: { n: i + 1, id }, uploadedMedia: null },
      job: jobs[i],
    })),
    errors: null,
  });

  expect(refreshTarget.mock).toHaveBeenCalledTimes(4);
  expect(accomplishRequest.mock).toHaveBeenCalledTimes(4);
  expect(refreshTarget.mock).toHaveBeenNthCalledWith(
    1,
    { id: 1 },
    { id: 2, n: 1 }
  );
  expect(refreshTarget.mock).toHaveBeenNthCalledWith(
    2,
    { id: 10 },
    { id: 11, n: 3 }
  );
  expect(refreshTarget.mock).toHaveBeenNthCalledWith(
    3,
    { id: 2 },
    { id: 3, n: 2 }
  );
  expect(refreshTarget.mock).toHaveBeenNthCalledWith(
    4,
    { id: 11 },
    { id: 12, n: 4 }
  );
  expect(accomplishRequest.mock.calls.map(({ args }) => args[0])).toEqual([
    { id: 1 },
    { id: 10 },
    { id: 2 },
    { id: 11 },
  ]);

  // reset target if refreshTarget return null
  refreshTarget.mock.fakeReturnValue(null);

  await expect(queue.executeJobs(jobs)).resolves.toEqual({
    success: true,
    batch: [4, 2, 13, 11].map((id, i) => ({
      success: true,
      result: { code: 200, body: { n: i + 1, id }, uploadedMedia: null },
      job: jobs[i],
    })),
    errors: null,
  });
  expect(refreshTarget.mock.calls.slice(4).map(({ args }) => args)).toEqual([
    [{ id: 3 }, { n: 1, id: 4 }],
    [{ id: 12 }, { n: 3, id: 13 }],
    [{ id: 1 }, { n: 2, id: 2 }],
    [{ id: 10 }, { n: 4, id: 11 }],
  ]);
  expect(
    accomplishRequest.mock.calls.slice(4).map(({ args }) => args[0])
  ).toEqual([{ id: 3 }, { id: 12 }, { id: 1 }, { id: 10 }]);

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
    parameters: { ...request.parameters, media: mediaIds },
  }));

  const jobs = [
    {
      key: 'alpha',
      target: { id: 1 },
      accomplishRequest,
      request: { method: 'POST', href: '2/foo', parameters: { n: 1 } },
      mediaSources: [
        { type: 'id', id: '111111111111111111' },
        {
          type: 'file',
          parameters: { total_bytes: 11, media_type: 'image/png' },
          fileData: Buffer.from('hello media'),
          fileInfo: { contentType: 'image/png', knownLength: 11 },
          assetTag: 'foo',
        },
        {
          type: 'url',
          parameters: {},
          url: 'https://cat.io/cute',
          assetTag: 'bar',
        },
      ],
    },
    {
      key: 'beta',
      target: { id: 2 },
      accomplishRequest,
      request: { method: 'POST', href: '2/foo', parameters: { n: 2 } },
      mediaSources: [
        {
          type: 'url',
          parameters: {
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

  expect(accomplishRequest.mock).toHaveBeenCalledTimes(2);
  expect(accomplishRequest.mock).toHaveBeenCalledWith(
    { id: 1 },
    jobs[0].request,
    ['111111111111111111', '222222222222222222', '333333333333333333']
  );
  expect(accomplishRequest.mock).toHaveBeenCalledWith(
    { id: 2 },
    jobs[1].request,
    ['444444444444444444']
  );

  expect(
    uploadBodySpy.mock.calls.map(({ args }) =>
      args[0].replace(/-{10}[0-9]+/g, 'BOUNDARY-PLACEHOLDER')
    )
  ).toMatchSnapshot();

  expect(authorizationSpy.mock).toHaveBeenCalledTimes(11);
  expect(
    authorizationSpy.mock.calls.map(({ args }) => args[0])
  ).toMatchSnapshot();

  expect(uploadCall.isDone()).toBe(true);
  expect(apiCall.isDone()).toBe(true);
  expect(externalMediaFileCall.isDone()).toBe(true);
});
