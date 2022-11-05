import moxy from '@moxyjs/moxy';
import nock from 'nock';
import Queue from '@sociably/core/queue';
import MetaApiWorker from '../Worker';

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

nock.disableNetConnect();

const jobs = [
  {
    key: 'facebook:id:foo',
    request: {
      method: 'POST',
      relative_url: 'me/messages',
      body: { recipient: { id: 'foo' }, id: 1 },
    },
  },
  {
    key: 'facebook:id:foo',
    request: {
      method: 'POST',
      relative_url: 'bar/baz',
      body: { recipient: { id: 'foo' }, id: 2 },
    },
  },
  {
    key: 'facebook:id:foo',
    request: {
      method: 'POST',
      relative_url: 'me/messages',
      body: { recipient: { id: 'foo' }, id: 3 },
    },
  },
];

const bodySpy = moxy(() => true);

let graphApi;
let queue;
beforeEach(() => {
  graphApi = nock('https://graph.facebook.com');
  queue = new Queue();
  bodySpy.mock.clear();
});

afterEach(() => {
  nock.cleanAll();
});

it('call to graph api', async () => {
  const accessToken = '_access_token_';
  const worker = new MetaApiWorker(accessToken, 0, 'v11.0', undefined);

  const scope = graphApi.post('/v11.0/', bodySpy).reply(
    200,
    JSON.stringify(
      new Array(3).fill({
        code: 200,
        body: JSON.stringify({ message_id: 'xxx', recipient_id: 'xxx' }),
      })
    )
  );

  worker.start(queue);

  const expectedResult = {
    code: 200,
    body: { message_id: 'xxx', recipient_id: 'xxx' },
  };
  await expect(queue.executeJobs(jobs)).resolves.toEqual({
    success: true,
    errors: null,
    batch: [
      { success: true, job: jobs[0], result: expectedResult },
      { success: true, job: jobs[1], result: expectedResult },
      { success: true, job: jobs[2], result: expectedResult },
    ],
  });

  expect(bodySpy.mock).toHaveBeenCalledTimes(1);
  const body = bodySpy.mock.calls[0].args[0];

  expect(body.access_token).toBe(accessToken);
  expect(body.include_headers).toBe(undefined);
  expect(body).toMatchSnapshot();

  const batch = JSON.parse(body.batch);

  let lastName;
  batch.forEach((request, i) => {
    expect(request.method).toBe('POST');
    expect(request.relative_url).toBe(i === 1 ? 'bar/baz' : 'me/messages');
    expect(request.omit_response_on_success).toBe(false);

    expect(request.depends_on).toBe(lastName);
    lastName = request.name;

    expect(request.body).toBe(
      `recipient=${encodeURIComponent('{"id":"foo"}')}&id=${i + 1}`
    );
  });

  expect(scope.isDone()).toBe(true);
});

it('attach appsecret_proof if appSecret is given', async () => {
  const accessToken = '_fb_graph_api_access_token_';
  const appSecret = '_fb_app_secret_';
  const expectedProof =
    'c3d9a02ac88561d9721b3cb2ba338c933f0666b68ad29523393b830b3916cd91';

  const worker = new MetaApiWorker(accessToken, 0, 'v11.0', appSecret);

  const scope = graphApi.post('/v11.0/', bodySpy).reply(
    200,
    JSON.stringify(
      new Array(3).fill({
        code: 200,
        body: JSON.stringify({ message_id: 'xxx', recipient_id: 'xxx' }),
      })
    )
  );

  worker.start(queue);

  const expectedResult = {
    code: 200,
    body: { message_id: 'xxx', recipient_id: 'xxx' },
  };
  await expect(queue.executeJobs(jobs)).resolves.toEqual({
    success: true,
    errors: null,
    batch: [
      { success: true, job: jobs[0], result: expectedResult },
      { success: true, job: jobs[1], result: expectedResult },
      { success: true, job: jobs[2], result: expectedResult },
    ],
  });

  const body = bodySpy.mock.calls[0].args[0];

  expect(body.access_token).toBe(accessToken);
  expect(body.appsecret_proof).toBe(expectedProof);
  expect(body).toMatchSnapshot();

  expect(scope.isDone()).toBe(true);
});

test('use different graph api version', async () => {
  const worker1 = new MetaApiWorker('_access_token_', 0, 'v8.0', undefined);
  const scope1 = graphApi.post('/v8.0/').reply(200, '[]');

  worker1.start(queue);
  await queue.executeJobs(jobs);
  expect(scope1.isDone()).toBe(true);
  worker1.stop(queue);

  const worker2 = new MetaApiWorker('_access_token_', 0, 'v10.0', undefined);
  const scope2 = graphApi.post('/v10.0/').reply(200, '[]');

  worker2.start(queue);
  await queue.executeJobs(jobs);
  expect(scope2.isDone()).toBe(true);
});

it('upload files with form data if binary attached on job', async () => {
  const worker = new MetaApiWorker('_access_token_', 0, 'v11.0', undefined);

  const scope = graphApi
    .matchHeader('content-type', /multipart\/form-data.*/)
    .post('/v11.0/', bodySpy)
    .reply(
      200,
      JSON.stringify(
        new Array(3).fill({
          code: 200,
          body: JSON.stringify({ message_id: 'xxx', recipient_id: 'xxx' }),
        })
      )
    );

  worker.start(queue);

  const jobsWithFiles = [
    { ...jobs[0], fileData: '_file0_' },
    {
      ...jobs[1],
      fileData: '_file1_',
      fileInfo: {
        filename: 'YouDontSay.jpg',
        contentType: 'image/jpeg',
        knownLength: 19806,
      },
    },
    jobs[2],
  ];

  const expectedResult = {
    code: 200,
    body: { message_id: 'xxx', recipient_id: 'xxx' },
  };

  await expect(
    queue.executeJobs([
      { ...jobs[0], fileData: '_file0_' },
      {
        ...jobs[1],
        fileData: '_file1_',
        fileInfo: {
          filename: 'YouDontSay.jpg',
          contentType: 'image/jpeg',
          knownLength: 19806,
        },
      },
      { ...jobs[2] },
    ])
  ).resolves.toEqual({
    success: true,
    errors: null,
    batch: [
      { success: true, job: jobsWithFiles[0], result: expectedResult },
      { success: true, job: jobsWithFiles[1], result: expectedResult },
      { success: true, job: jobsWithFiles[2], result: expectedResult },
    ],
  });

  expect(bodySpy.mock).toHaveBeenCalledTimes(1);
  const body = bodySpy.mock.calls[0].args[0];

  expect(
    body.replace(/-----+[0-9]+/g, '-----MULTIPART_SEPARATOR-----')
  ).toMatchSnapshot();

  const file0Field = new RegExp(
    'Content-Disposition: form-data; name="(?<name>.+)"[\\n\\r\\s]+_file0_'
  ).exec(body);
  const file1Field = new RegExp(
    'Content-Disposition: form-data; name="(?<name>.+)"; filename="YouDontSay.jpg"' +
      '[\\n\\r\\s]+Content-Type: image/jpeg' +
      '[\\n\\r\\s]+_file1_'
  ).exec(body);

  expect(file0Field).toBeTruthy();
  expect(file1Field).toBeTruthy();

  expect(body).toMatch(
    /Content-Disposition: form-data; name="access_token"[\n\r\s]+_access_token_/
  );

  const batch = JSON.parse(
    body.match(
      /Content-Disposition: form-data; name="batch"[\n\r\s]+(.*)[\n\r\s]+-+/
    )[1]
  );

  expect(batch[0].attached_files).toBe(file0Field![1]);
  expect(batch[1].attached_files).toBe(file1Field![1]);

  let lastName;
  batch.forEach((request, i) => {
    expect(request.method).toBe('POST');
    expect(request.relative_url).toBe(i === 1 ? 'bar/baz' : 'me/messages');
    expect(request.omit_response_on_success).toBe(false);

    expect(request.depends_on).toBe(lastName);
    lastName = request.name;

    expect(request.body).toBe(
      `recipient=${encodeURIComponent('{"id":"foo"}')}&id=${i + 1}`
    );
  });

  expect(scope.isDone()).toBe(true);
});

it('throw if connection error happen', async () => {
  const worker = new MetaApiWorker('_access_token_', 0, 'v11.0', undefined);

  const scope = graphApi
    .post('/v11.0/')
    .replyWithError('something wrong like connection error');

  worker.start(queue);
  await expect(queue.executeJobs(jobs)).resolves.toMatchInlineSnapshot(`
              Object {
                "batch": null,
                "errors": Array [
                  [FetchError: request to https://graph.facebook.com/v11.0/ failed, reason: something wrong like connection error],
                ],
                "success": false,
              }
          `);

  expect(scope.isDone()).toBe(true);
});

it('throw if api error happen', async () => {
  const worker = new MetaApiWorker('_access_token_', 0, 'v11.0', undefined);

  const scope = graphApi.post('/v11.0/').reply(400, {
    error: {
      message: 'The access token could not be decrypted',
      type: 'OAuthException',
      code: 190,
      fbtrace_id: 'Ecsj7hz8eB0',
    },
  });

  worker.start(queue);
  await expect(queue.executeJobs(jobs)).resolves.toMatchInlineSnapshot(`
              Object {
                "batch": null,
                "errors": Array [
                  [GraphAPIError (OAuthException): The access token could not be decrypted],
                ],
                "success": false,
              }
          `);

  expect(scope.isDone()).toBe(true);
});

it('throw if one single job fail', async () => {
  const worker = new MetaApiWorker('_access_token_', 0, 'v11.0', undefined);

  const scope = graphApi.post('/v11.0/').reply(
    200,
    JSON.stringify([
      {
        code: 200,
        body: JSON.stringify({ message_id: 'xxx', recipient_id: 'xxx' }),
      },
      {
        code: 400,
        body: JSON.stringify({
          error: {
            message: 'you should not passed!',
            type: 'OAuthException',
            code: 999,
            fbtrace_id: 'DuNgzaHdmcb',
          },
        }),
      },
      {
        code: 200,
        body: JSON.stringify({ message_id: 'xxx', recipient_id: 'xxx' }),
      },
    ])
  );

  worker.start(queue);
  const execRes = await queue.executeJobs(jobs);
  expect(execRes.success).toBe(false);
  expect(execRes).toMatchSnapshot();
  expect(execRes.errors).toMatchInlineSnapshot(`
    Array [
      [GraphAPIError (OAuthException): you should not passed!],
    ]
  `);

  expect(scope.isDone()).toBe(true);
});

it('waits consumeInterval for jobs to execute if set', async () => {
  const worker = new MetaApiWorker('_access_token_', 300, 'v11.0', undefined);

  const scope = graphApi.post('/v11.0/', bodySpy).reply(
    200,
    JSON.stringify(
      new Array(9).fill({
        code: 200,
        body: JSON.stringify({ message_id: 'xxx', recipient_id: 'xxx' }),
      })
    )
  );

  worker.start(queue);

  const promise1 = queue.executeJobs(jobs);
  expect(bodySpy.mock).not.toHaveBeenCalled();
  await delay(110);

  const promise2 = queue.executeJobs(jobs);
  expect(bodySpy.mock).not.toHaveBeenCalled();
  await delay(110);

  const promise3 = queue.executeJobs(jobs);
  expect(bodySpy.mock).not.toHaveBeenCalled();
  await delay(210);

  expect(bodySpy.mock).toHaveBeenCalled();
  expect(scope.isDone()).toBe(true);

  await Promise.all([promise1, promise2, promise3]);

  worker.stop(queue);
});

it('execute immediatly if consumeInterval is 0', async () => {
  const worker = new MetaApiWorker('_access_token_', 0, 'v11.0', undefined);

  const scope = graphApi
    .post('/v11.0/', bodySpy)
    .times(3)
    .delay(50)
    .reply(
      200,
      JSON.stringify(
        new Array(3).fill({
          code: 200,
          body: JSON.stringify({ message_id: 'xxx', recipient_id: 'xxx' }),
        })
      )
    );

  worker.start(queue);

  const promise1 = queue.executeJobs(jobs);
  expect(bodySpy.mock).toHaveBeenCalledTimes(1);

  await delay(100);
  const promise2 = queue.executeJobs(jobs);
  expect(bodySpy.mock).toHaveBeenCalledTimes(2);

  await delay(100);
  const promise3 = queue.executeJobs(jobs);
  expect(bodySpy.mock).toHaveBeenCalledTimes(3);

  expect(scope.isDone()).toBe(true);
  await promise1;
  await promise2;
  await promise3;
});

it('use querystring params for GET request', async () => {
  const accessToken = '_access_token_';
  const worker = new MetaApiWorker(accessToken, 0, 'v11.0', undefined);

  const scope = graphApi
    .post('/v11.0/', bodySpy)
    .reply(
      200,
      JSON.stringify([
        { code: 200, body: JSON.stringify({ result: 'success' }) },
      ])
    );

  worker.start(queue);

  const job = {
    key: undefined,
    request: {
      method: 'GET',
      relative_url: '1234567890',
      body: { fields: ['id', 'name', 'email'] },
    },
  };

  await expect(queue.executeJobs([job])).resolves.toEqual({
    success: true,
    errors: null,
    batch: [
      {
        success: true,
        job,
        result: { code: 200, body: { result: 'success' } },
      },
    ],
  });

  expect(bodySpy.mock).toHaveBeenCalledTimes(1);
  const body = bodySpy.mock.calls[0].args[0];

  expect(body.access_token).toBe(accessToken);
  expect(body).toMatchSnapshot();

  const [request] = JSON.parse(body.batch);

  expect(request).toEqual({
    method: 'GET',
    relative_url: `1234567890?fields=${encodeURIComponent(
      JSON.stringify(['id', 'name', 'email'])
    )}`,
    omit_response_on_success: false,
    depends_on: undefined,
    body: undefined,
  });

  expect(scope.isDone()).toBe(true);
});

it('use querystring params for DELETE request', async () => {
  const accessToken = '_access_token_';
  const worker = new MetaApiWorker(accessToken, 0, 'v11.0', undefined);

  const scope = graphApi
    .post('/v11.0/', bodySpy)
    .reply(
      200,
      JSON.stringify([
        { code: 200, body: JSON.stringify({ result: 'success' }) },
      ])
    );

  worker.start(queue);

  const job = {
    key: undefined,
    request: {
      method: 'DELETE',
      relative_url: 'me/messenger_profile',
      body: { fields: ['whitelisted_domains'] },
    },
  };

  await expect(queue.executeJobs([job])).resolves.toEqual({
    success: true,
    errors: null,
    batch: [
      {
        success: true,
        job,
        result: { code: 200, body: { result: 'success' } },
      },
    ],
  });

  expect(bodySpy.mock).toHaveBeenCalledTimes(1);
  const body = bodySpy.mock.calls[0].args[0];

  expect(body.access_token).toBe(accessToken);
  expect(body).toMatchSnapshot();

  const [request] = JSON.parse(body.batch);

  expect(request).toEqual({
    method: 'DELETE',
    relative_url: 'me/messenger_profile?fields=%5B%22whitelisted_domains%22%5D',
    omit_response_on_success: false,
    depends_on: undefined,
    body: undefined,
  });

  expect(scope.isDone()).toBe(true);
});

describe('using API result in following request', () => {
  const accomplishRequest = moxy((request, keys, getResult) => ({
    ...request,
    body: {
      ...request.body,
      images: keys.map((k) => ({ id: getResult(k, '$.id') })),
    },
  }));

  const continuousJobs = [
    {
      key: 'foo_channel',
      request: {
        method: 'POST',
        relative_url: '1234567890/media',
        body: {
          type: 'image/jpeg',
          file: '@/pretend/to/upload/a/file.jpg',
        },
      },
      registerResult: 'image_1',
    },
    {
      key: 'foo_channel',
      request: {
        method: 'POST',
        relative_url: '1234567890/media',
        body: {
          type: 'image/jpeg',
          file: '@/pretend/to/upload/b/file.jpg',
        },
      },
      registerResult: 'image_2',
    },
    {
      key: 'foo_channel',
      request: {
        method: 'POST',
        relative_url: '1234567890/messages',
        body: {
          to: '9876543210',
          type: 'image',
          images: [],
        },
      },
      consumeResult: {
        keys: ['image_1', 'image_2'],
        accomplishRequest,
      },
    },
  ];

  const continuousApiResults = [
    { code: 201, body: JSON.stringify({ id: '1111111111' }) },
    { code: 201, body: JSON.stringify({ id: '2222222222' }) },
    {
      code: 200,
      body: JSON.stringify({
        messages: [{ id: '123' }],
      }),
    },
  ];

  beforeEach(() => {
    accomplishRequest.mock.clear();
  });

  const decodeBatchedRequest = (request) => ({
    ...request,
    body: decodeURIComponent(request.body),
  });

  test('registerResult & consumeResult in the same batch', async () => {
    const worker = new MetaApiWorker('_access_token_', 0, 'v11.0', undefined);

    const apiCall = graphApi
      .post('/v11.0/', bodySpy)
      .reply(200, JSON.stringify(continuousApiResults));

    worker.start(queue);
    await expect(queue.executeJobs(continuousJobs)).resolves.toMatchSnapshot();

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];
    expect(body).toMatchSnapshot();

    expect(JSON.parse(body.batch).map(decodeBatchedRequest))
      .toMatchInlineSnapshot(`
      Array [
        Object {
          "body": "type=image/jpeg&file=@/pretend/to/upload/a/file.jpg",
          "method": "POST",
          "name": "foo_channel-1",
          "omit_response_on_success": false,
          "relative_url": "1234567890/media",
        },
        Object {
          "body": "type=image/jpeg&file=@/pretend/to/upload/b/file.jpg",
          "depends_on": "foo_channel-1",
          "method": "POST",
          "name": "foo_channel-2",
          "omit_response_on_success": false,
          "relative_url": "1234567890/media",
        },
        Object {
          "body": "to=9876543210&type=image&images=[{\\"id\\":\\"{result=foo_channel-1:$.id}\\"},{\\"id\\":\\"{result=foo_channel-2:$.id}\\"}]",
          "depends_on": "foo_channel-2",
          "method": "POST",
          "name": "foo_channel-3",
          "omit_response_on_success": false,
          "relative_url": "1234567890/messages",
        },
      ]
    `);

    expect(accomplishRequest.mock).toHaveBeenCalledTimes(1);
    expect(accomplishRequest.mock).toHaveBeenCalledWith(
      continuousJobs[2].request,
      ['image_1', 'image_2'],
      expect.any(Function)
    );

    expect(apiCall.isDone()).toBe(true);
  });

  test('when job key is undeinfed', async () => {
    const worker = new MetaApiWorker('_access_token_', 0, 'v11.0', undefined);

    const apiCall = graphApi
      .post('/v11.0/', bodySpy)
      .reply(200, JSON.stringify(continuousApiResults));

    worker.start(queue);
    await expect(
      queue.executeJobs(
        continuousJobs.map((job) => ({ ...job, key: undefined }))
      )
    ).resolves.toMatchSnapshot();

    const body = bodySpy.mock.calls[0].args[0];
    expect(JSON.parse(body.batch).map(decodeBatchedRequest))
      .toMatchInlineSnapshot(`
      Array [
        Object {
          "body": "type=image/jpeg&file=@/pretend/to/upload/a/file.jpg",
          "method": "POST",
          "name": "#request-0",
          "omit_response_on_success": false,
          "relative_url": "1234567890/media",
        },
        Object {
          "body": "type=image/jpeg&file=@/pretend/to/upload/b/file.jpg",
          "method": "POST",
          "name": "#request-1",
          "omit_response_on_success": false,
          "relative_url": "1234567890/media",
        },
        Object {
          "body": "to=9876543210&type=image&images=[{\\"id\\":\\"{result=#request-0:$.id}\\"},{\\"id\\":\\"{result=#request-1:$.id}\\"}]",
          "method": "POST",
          "omit_response_on_success": false,
          "relative_url": "1234567890/messages",
        },
      ]
    `);

    expect(accomplishRequest.mock).toHaveBeenCalledTimes(1);
    expect(accomplishRequest.mock).toHaveBeenCalledWith(
      continuousJobs[2].request,
      ['image_1', 'image_2'],
      expect.any(Function)
    );

    expect(apiCall.isDone()).toBe(true);
  });

  test('registerResult & consumeResult in different batches', async () => {
    const worker = new MetaApiWorker('_access_token_', 0, 'v11.0', undefined);

    const apiCall1 = graphApi.post('/v11.0/', bodySpy).reply(
      200,
      JSON.stringify([
        ...new Array(49).fill({
          code: 200,
          body: JSON.stringify({ result: 'ok' }),
        }),
        continuousApiResults[0],
      ])
    );
    const apiCall2 = graphApi
      .post('/v11.0/', bodySpy)
      .reply(200, JSON.stringify(continuousApiResults.slice(1)));

    worker.start(queue);
    await expect(
      queue.executeJobs([
        ...new Array(49).fill({
          request: { method: 'GET', relative_url: '1234567890' },
        }),
        ...continuousJobs,
      ])
    ).resolves.toMatchSnapshot();

    expect(bodySpy.mock).toHaveBeenCalledTimes(2);
    const body1 = bodySpy.mock.calls[0].args[0];
    const body2 = bodySpy.mock.calls[1].args[0];
    expect(body1).toMatchSnapshot();
    expect(body2).toMatchSnapshot();

    expect(decodeBatchedRequest(JSON.parse(body1.batch)[49]))
      .toMatchInlineSnapshot(`
      Object {
        "body": "type=image/jpeg&file=@/pretend/to/upload/a/file.jpg",
        "method": "POST",
        "name": "foo_channel-1",
        "omit_response_on_success": false,
        "relative_url": "1234567890/media",
      }
    `);
    expect(decodeBatchedRequest(JSON.parse(body2.batch)[0]))
      .toMatchInlineSnapshot(`
      Object {
        "body": "type=image/jpeg&file=@/pretend/to/upload/b/file.jpg",
        "method": "POST",
        "name": "foo_channel-1",
        "omit_response_on_success": false,
        "relative_url": "1234567890/media",
      }
    `);
    expect(decodeBatchedRequest(JSON.parse(body2.batch)[1]))
      .toMatchInlineSnapshot(`
      Object {
        "body": "to=9876543210&type=image&images=[{\\"id\\":\\"1111111111\\"},{\\"id\\":\\"{result=foo_channel-1:$.id}\\"}]",
        "depends_on": "foo_channel-1",
        "method": "POST",
        "name": "foo_channel-2",
        "omit_response_on_success": false,
        "relative_url": "1234567890/messages",
      }
    `);

    expect(accomplishRequest.mock).toHaveBeenCalledTimes(1);
    expect(accomplishRequest.mock).toHaveBeenCalledWith(
      continuousJobs[2].request,
      ['image_1', 'image_2'],
      expect.any(Function)
    );

    expect(apiCall1.isDone()).toBe(true);
    expect(apiCall2.isDone()).toBe(true);
  });
});
