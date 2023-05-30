import { moxy } from '@moxyjs/moxy';
import nock from 'nock';
import Queue from '@sociably/core/queue';
import MetaApiWorker from '../Worker.js';

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

nock.disableNetConnect();

const appId = '_APP_ID_';
const appSecret = '_APP_SECRET_';

const agentSettingsAccessor = moxy({
  getAgentSettings: async (channel) => ({
    accessToken: `access_token_${channel.uid}`,
  }),
  getAgentSettingsBatch: async (channels) => {
    return channels.map((channel) => ({
      accessToken: `access_token_${channel.uid}`,
    }));
  },
});

const jobs = [
  {
    key: 'facebook.id.foo.john',
    request: {
      method: 'POST',
      url: 'me/messages',
      params: { recipient: { id: 'john' }, id: 1 },
    },
    channel: { platform: 'test', uid: 'foo' },
  },
  {
    key: 'facebook.id.foo.john',
    request: {
      method: 'POST',
      url: 'some/api',
      params: { recipient: { id: 'john' }, id: 2 },
    },
    channel: { platform: 'test', uid: 'foo' },
  },
  {
    key: 'facebook.id.bar.jane',
    request: {
      method: 'POST',
      url: 'me/messages',
      params: { recipient: { id: 'jane' }, id: 3 },
    },
    channel: { platform: 'test', uid: 'bar' },
  },
  {
    key: 'facebook.id.baz.jojo',
    request: {
      method: 'POST',
      url: 'another/api',
      params: { recipient: { id: 'jojo' }, id: 4 },
    },
    channel: { platform: 'test', uid: 'baz' },
  },
];

const bodySpy = moxy(() => true);

let graphApi;
let queue;
beforeEach(() => {
  graphApi = nock('https://graph.facebook.com');
  queue = new Queue();
  bodySpy.mock.clear();
  agentSettingsAccessor.mock.reset();
});

afterEach(() => {
  nock.cleanAll();
});

it('call to graph api', async () => {
  const worker = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v11.0',
    consumeInterval: 0,
  });

  const scope = graphApi.post('/v11.0/', bodySpy).reply(
    200,
    JSON.stringify(
      new Array(4).fill({
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
      { success: true, job: jobs[3], result: expectedResult },
    ],
  });

  expect(bodySpy).toHaveBeenCalledTimes(1);
  const body = bodySpy.mock.calls[0].args[0];

  expect(body.access_token).toBe('access_token_foo');
  expect(body.include_headers).toBe(undefined);

  expect(body.appsecret_proof).toMatchInlineSnapshot(
    `"c75729ba2a8b2a96a945b4f86274bd417c62a7f1a301a0f6913e180efdab0e2e"`
  );

  expect(body).toMatchSnapshot();

  const batch = JSON.parse(body.batch);
  expect(batch).toMatchInlineSnapshot(`
    [
      {
        "body": "recipient=%7B%22id%22%3A%22john%22%7D&id=1",
        "method": "POST",
        "name": "facebook.id.foo.john-1",
        "omit_response_on_success": false,
        "relative_url": "me/messages?access_token=access_token_foo",
      },
      {
        "body": "recipient=%7B%22id%22%3A%22john%22%7D&id=2",
        "depends_on": "facebook.id.foo.john-1",
        "method": "POST",
        "name": "facebook.id.foo.john-2",
        "omit_response_on_success": false,
        "relative_url": "some/api?access_token=access_token_foo",
      },
      {
        "body": "recipient=%7B%22id%22%3A%22jane%22%7D&id=3",
        "method": "POST",
        "name": "facebook.id.bar.jane-1",
        "omit_response_on_success": false,
        "relative_url": "me/messages?access_token=access_token_bar",
      },
      {
        "body": "recipient=%7B%22id%22%3A%22jojo%22%7D&id=4",
        "method": "POST",
        "name": "facebook.id.baz.jojo-1",
        "omit_response_on_success": false,
        "relative_url": "another/api?access_token=access_token_baz",
      },
    ]
  `);

  expect(scope.isDone()).toBe(true);
});

test('use different graph api version', async () => {
  const worker1 = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v8.0',
    consumeInterval: 0,
  });
  const scope1 = graphApi.post('/v8.0/').reply(200, '[]');

  worker1.start(queue);
  await queue.executeJobs(jobs);
  expect(scope1.isDone()).toBe(true);
  worker1.stop(queue);

  const worker2 = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v10.0',
    consumeInterval: 0,
  });
  const scope2 = graphApi.post('/v10.0/').reply(200, '[]');

  worker2.start(queue);
  await queue.executeJobs(jobs);
  expect(scope2.isDone()).toBe(true);
});

it('upload files with form data if binary attached on job', async () => {
  const worker = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v11.0',
    consumeInterval: 0,
  });

  const scope = graphApi
    .matchHeader('content-type', /multipart\/form-data.*/)
    .post('/v11.0/', bodySpy)
    .reply(
      200,
      JSON.stringify(
        new Array(4).fill({
          code: 200,
          body: JSON.stringify({ message_id: 'xxx', recipient_id: 'xxx' }),
        })
      )
    );

  worker.start(queue);

  const jobsWithFiles = [
    { ...jobs[0], file: { data: '_file0_' } },
    jobs[1],
    {
      ...jobs[2],
      file: {
        data: '_file1_',
        info: {
          filename: 'YouDontSay.jpg',
          contentType: 'image/jpeg',
        },
      },
    },
    {
      ...jobs[3],
      file: {
        data: '_file2_',
        info: {
          filename: 'Cage.gif',
          contentType: 'image/gif',
        },
      },
    },
  ];

  const expectedResult = {
    code: 200,
    body: { message_id: 'xxx', recipient_id: 'xxx' },
  };

  await expect(queue.executeJobs(jobsWithFiles)).resolves.toEqual({
    success: true,
    errors: null,
    batch: [
      { success: true, job: jobsWithFiles[0], result: expectedResult },
      { success: true, job: jobsWithFiles[1], result: expectedResult },
      { success: true, job: jobsWithFiles[2], result: expectedResult },
      { success: true, job: jobsWithFiles[3], result: expectedResult },
    ],
  });

  expect(bodySpy).toHaveBeenCalledTimes(1);
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
  const file2Field = new RegExp(
    'Content-Disposition: form-data; name="(?<name>.+)"; filename="Cage.gif"' +
      '[\\n\\r\\s]+Content-Type: image/gif' +
      '[\\n\\r\\s]+_file2_'
  ).exec(body);

  expect(file0Field).toBeTruthy();
  expect(file1Field).toBeTruthy();

  expect(body).toMatch(
    /Content-Disposition: form-data; name="access_token"[\n\r\s]+access_token_foo/
  );

  const batch = JSON.parse(
    body.match(
      /Content-Disposition: form-data; name="batch"[\n\r\s]+(.*)[\n\r\s]+-+/
    )[1]
  );

  expect(batch[0].attached_files).toBe(file0Field![1]);
  expect(batch[2].attached_files).toBe(file1Field![1]);
  expect(batch[3].attached_files).toBe(file2Field![1]);

  expect(batch).toMatchInlineSnapshot(`
    [
      {
        "attached_files": "file_0",
        "body": "recipient=%7B%22id%22%3A%22john%22%7D&id=1",
        "method": "POST",
        "name": "facebook.id.foo.john-1",
        "omit_response_on_success": false,
        "relative_url": "me/messages?access_token=access_token_foo",
      },
      {
        "body": "recipient=%7B%22id%22%3A%22john%22%7D&id=2",
        "depends_on": "facebook.id.foo.john-1",
        "method": "POST",
        "name": "facebook.id.foo.john-2",
        "omit_response_on_success": false,
        "relative_url": "some/api?access_token=access_token_foo",
      },
      {
        "attached_files": "file_1",
        "body": "recipient=%7B%22id%22%3A%22jane%22%7D&id=3",
        "method": "POST",
        "name": "facebook.id.bar.jane-1",
        "omit_response_on_success": false,
        "relative_url": "me/messages?access_token=access_token_bar",
      },
      {
        "attached_files": "file_2",
        "body": "recipient=%7B%22id%22%3A%22jojo%22%7D&id=4",
        "method": "POST",
        "name": "facebook.id.baz.jojo-1",
        "omit_response_on_success": false,
        "relative_url": "another/api?access_token=access_token_baz",
      },
    ]
  `);

  expect(scope.isDone()).toBe(true);
});

it('throw if connection error happen', async () => {
  const worker = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v11.0',
    consumeInterval: 0,
  });

  const scope = graphApi
    .post('/v11.0/')
    .replyWithError('something wrong like connection error');

  worker.start(queue);
  await expect(queue.executeJobs(jobs)).resolves.toMatchInlineSnapshot(`
    {
      "batch": null,
      "errors": [
        [FetchError: request to https://graph.facebook.com/v11.0/ failed, reason: something wrong like connection error],
      ],
      "success": false,
    }
  `);

  expect(scope.isDone()).toBe(true);
});

it('throw if api error happen', async () => {
  const worker = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v11.0',
    consumeInterval: 0,
  });
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
    {
      "batch": null,
      "errors": [
        [GraphAPIError (OAuthException): The access token could not be decrypted],
      ],
      "success": false,
    }
  `);

  expect(scope.isDone()).toBe(true);
});

it('fail if one single job fail', async () => {
  const worker = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v11.0',
    consumeInterval: 0,
  });

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
    [
      [GraphAPIError (OAuthException): you should not passed!],
    ]
  `);

  expect(scope.isDone()).toBe(true);
});

it('waits consumeInterval for jobs to execute if set', async () => {
  const worker = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v11.0',
    consumeInterval: 300,
  });
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
  expect(bodySpy).not.toHaveBeenCalled();
  await delay(110);

  const promise2 = queue.executeJobs(jobs);
  expect(bodySpy).not.toHaveBeenCalled();
  await delay(110);

  const promise3 = queue.executeJobs(jobs);
  expect(bodySpy).not.toHaveBeenCalled();
  await delay(210);

  expect(bodySpy).toHaveBeenCalled();
  expect(scope.isDone()).toBe(true);

  await Promise.all([promise1, promise2, promise3]);

  worker.stop(queue);
});

it('execute immediatly if consumeInterval is 0', async () => {
  const worker = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v11.0',
    consumeInterval: 0,
  });
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
  await delay(0);
  expect(bodySpy).toHaveBeenCalledTimes(1);

  await delay(100);
  const promise2 = queue.executeJobs(jobs);
  await delay(0);
  expect(bodySpy).toHaveBeenCalledTimes(2);

  await delay(100);
  const promise3 = queue.executeJobs(jobs);
  await delay(0);
  expect(bodySpy).toHaveBeenCalledTimes(3);

  expect(scope.isDone()).toBe(true);
  await promise1;
  await promise2;
  await promise3;
});

it('use querystring params for GET request', async () => {
  const worker = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v11.0',
    consumeInterval: 0,
  });
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
      url: '1234567890',
      params: { fields: ['id', 'name', 'email'] },
    },
    channel: { uid: 'foo' },
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

  expect(bodySpy).toHaveBeenCalledTimes(1);
  const body = bodySpy.mock.calls[0].args[0];

  expect(body.access_token).toBe('access_token_foo');
  expect(body).toMatchSnapshot();

  const [request] = JSON.parse(body.batch);

  expect(request).toMatchInlineSnapshot(`
    {
      "method": "GET",
      "omit_response_on_success": false,
      "relative_url": "1234567890?fields=%5B%22id%22%2C%22name%22%2C%22email%22%5D&access_token=access_token_foo",
    }
  `);

  expect(scope.isDone()).toBe(true);
});

it('use querystring params for DELETE request', async () => {
  const worker = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v11.0',
    consumeInterval: 0,
  });
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
      url: 'me/messenger_profile',
      params: { fields: ['whitelisted_domains'] },
    },
    channel: { uid: 'foo' },
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

  expect(bodySpy).toHaveBeenCalledTimes(1);
  const body = bodySpy.mock.calls[0].args[0];

  expect(body.access_token).toBe('access_token_foo');
  expect(body).toMatchSnapshot();

  const [request] = JSON.parse(body.batch);

  expect(request).toMatchInlineSnapshot(`
    {
      "method": "DELETE",
      "omit_response_on_success": false,
      "relative_url": "me/messenger_profile?fields=%5B%22whitelisted_domains%22%5D&access_token=access_token_foo",
    }
  `);

  expect(scope.isDone()).toBe(true);
});

test('asApplication job', async () => {
  const worker = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v11.0',
    consumeInterval: 0,
  });
  const scope = graphApi
    .post('/v11.0/', bodySpy)
    .reply(
      200,
      JSON.stringify([{ code: 200, body: JSON.stringify({ settings: 'ok' }) }])
    );
  worker.start(queue);

  await expect(
    queue.executeJobs([
      {
        request: {
          method: 'POST',
          url: 'settins/api',
          params: { some: 'app settings' },
        },
        asApplication: true,
      },
    ])
  ).resolves.toMatchSnapshot();

  expect(bodySpy).toHaveBeenCalledTimes(1);
  const body = bodySpy.mock.calls[0].args[0];

  expect(body.access_token).toBe('_APP_ID_|_APP_SECRET_');
  expect(body).toMatchSnapshot();

  const batch = JSON.parse(body.batch);

  expect(batch).toMatchInlineSnapshot(`
    [
      {
        "body": "some=app%20settings",
        "method": "POST",
        "omit_response_on_success": false,
        "relative_url": "settins/api?access_token=_APP_ID_%7C_APP_SECRET_",
      },
    ]
  `);
  expect(scope.isDone()).toBe(true);
});

test('job with accessToken', async () => {
  const worker = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v11.0',
    consumeInterval: 0,
  });
  const scope = graphApi
    .post('/v11.0/', bodySpy)
    .reply(
      200,
      JSON.stringify([{ code: 200, body: JSON.stringify({ settings: 'ok' }) }])
    );
  worker.start(queue);

  await expect(
    queue.executeJobs([
      {
        request: {
          method: 'POST',
          url: 'settins/api',
          params: { some: 'app settings' },
        },
        accessToken: '__MY_SPECIAL_ACCESS_TOKEN__',
      },
    ])
  ).resolves.toMatchSnapshot();

  expect(bodySpy).toHaveBeenCalledTimes(1);
  const body = bodySpy.mock.calls[0].args[0];

  expect(body.access_token).toBe('__MY_SPECIAL_ACCESS_TOKEN__');
  expect(body).toMatchSnapshot();

  const batch = JSON.parse(body.batch);

  expect(batch).toMatchInlineSnapshot(`
    [
      {
        "body": "some=app%20settings",
        "method": "POST",
        "omit_response_on_success": false,
        "relative_url": "settins/api?access_token=__MY_SPECIAL_ACCESS_TOKEN__",
      },
    ]
  `);
  expect(scope.isDone()).toBe(true);
});

it('skip job when no access token available', async () => {
  const worker = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v11.0',
    consumeInterval: 0,
  });
  agentSettingsAccessor.getAgentSettingsBatch.mock.fake(async (channels) => {
    return channels.map((channel) =>
      channel.uid === 'foo' ? { accessToken: `access_token_foo` } : null
    );
  });
  const scope = graphApi.post('/v11.0/', bodySpy).reply(200, (_, { batch }) =>
    JSON.stringify(
      JSON.parse(batch).map((_r, i) => ({
        code: 200,
        body: JSON.stringify({ id: i + 1 }),
      }))
    )
  );

  worker.start(queue);

  const jobAsApplication = {
    request: {
      method: 'POST',
      url: 'settins/api',
      params: { some: 'app settings' },
    },
    asApplication: true,
  };
  const jobWithAccessToken = {
    request: {
      method: 'POST',
      url: 'settins/api',
      params: { some: 'app settings' },
    },
    accessToken: '__MY_ACCESS_TOKEN__',
  };

  await expect(
    queue.executeJobs([jobWithAccessToken, ...jobs, jobAsApplication])
  ).resolves.toMatchSnapshot();

  expect(bodySpy).toHaveBeenCalledTimes(1);
  const body = bodySpy.mock.calls[0].args[0];

  expect(body.access_token).toBe('__MY_ACCESS_TOKEN__');
  expect(body).toMatchSnapshot();

  const batch = JSON.parse(body.batch);

  expect(batch).toMatchInlineSnapshot(`
    [
      {
        "body": "some=app%20settings",
        "method": "POST",
        "omit_response_on_success": false,
        "relative_url": "settins/api?access_token=__MY_ACCESS_TOKEN__",
      },
      {
        "body": "recipient=%7B%22id%22%3A%22john%22%7D&id=1",
        "method": "POST",
        "name": "facebook.id.foo.john-1",
        "omit_response_on_success": false,
        "relative_url": "me/messages?access_token=access_token_foo",
      },
      {
        "body": "recipient=%7B%22id%22%3A%22john%22%7D&id=2",
        "depends_on": "facebook.id.foo.john-1",
        "method": "POST",
        "name": "facebook.id.foo.john-2",
        "omit_response_on_success": false,
        "relative_url": "some/api?access_token=access_token_foo",
      },
      {
        "body": "some=app%20settings",
        "method": "POST",
        "omit_response_on_success": false,
        "relative_url": "settins/api?access_token=_APP_ID_%7C_APP_SECRET_",
      },
    ]
  `);
  expect(scope.isDone()).toBe(true);
});

it('skip request when fail to get access token for all the jobs', async () => {
  const worker = new MetaApiWorker({
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v11.0',
    consumeInterval: 0,
  });
  agentSettingsAccessor.getAgentSettingsBatch.mock.fake(async (channels) => {
    return channels.map(() => null);
  });

  worker.start(queue);

  await expect(
    queue.executeJobs([
      jobs[0],
      {
        request: {
          method: 'POST',
          url: 'settins/api',
          params: { some: 'app settings' },
        },
      },
    ])
  ).resolves.toMatchInlineSnapshot(`
    {
      "batch": [
        {
          "error": [Error: No access token available for channel foo],
          "job": {
            "channel": {
              "platform": "test",
              "uid": "foo",
            },
            "key": "facebook.id.foo.john",
            "request": {
              "method": "POST",
              "params": {
                "id": 1,
                "recipient": {
                  "id": "john",
                },
              },
              "url": "me/messages",
            },
          },
          "result": {
            "body": {},
            "code": 0,
            "headers": {},
          },
          "success": false,
        },
        {
          "error": [Error: No access token available for job],
          "job": {
            "request": {
              "method": "POST",
              "params": {
                "some": "app settings",
              },
              "url": "settins/api",
            },
          },
          "result": {
            "body": {},
            "code": 0,
            "headers": {},
          },
          "success": false,
        },
      ],
      "errors": [
        [Error: No access token available for channel foo],
        [Error: No access token available for job],
      ],
      "success": false,
    }
  `);

  expect(bodySpy).not.toHaveBeenCalled();
});

test('with defaultAccessTokenOption', async () => {
  const worker = new MetaApiWorker({
    defaultAccessToken: '_DEFAULT_ACCESS_TOKEN_',
    appId,
    appSecret,
    agentSettingsAccessor,
    graphApiVersion: 'v11.0',
    consumeInterval: 0,
  });
  agentSettingsAccessor.getAgentSettingsBatch.mock.fake(async (channels) => {
    return channels.map((channel) =>
      channel.uid === 'bar' ? { accessToken: `access_token_bar` } : null
    );
  });
  const scope = graphApi.post('/v11.0/', bodySpy).reply(200, (_, { batch }) =>
    JSON.stringify(
      JSON.parse(batch).map((_r, i) => ({
        code: 200,
        body: JSON.stringify({ id: i + 1 }),
      }))
    )
  );

  worker.start(queue);

  const asApplicationJob = {
    request: {
      method: 'POST',
      url: 'settins/api',
      params: { some: 'app settings' },
    },
    asApplication: true,
  };

  await expect(
    queue.executeJobs([...jobs, asApplicationJob])
  ).resolves.toMatchSnapshot();

  expect(bodySpy).toHaveBeenCalledTimes(1);
  const body = bodySpy.mock.calls[0].args[0];

  expect(body.access_token).toBe('_DEFAULT_ACCESS_TOKEN_');
  expect(body).toMatchSnapshot();

  const batch = JSON.parse(body.batch);

  expect(batch).toMatchInlineSnapshot(`
    [
      {
        "body": "recipient=%7B%22id%22%3A%22john%22%7D&id=1",
        "method": "POST",
        "name": "facebook.id.foo.john-1",
        "omit_response_on_success": false,
        "relative_url": "me/messages?access_token=_DEFAULT_ACCESS_TOKEN_",
      },
      {
        "body": "recipient=%7B%22id%22%3A%22john%22%7D&id=2",
        "depends_on": "facebook.id.foo.john-1",
        "method": "POST",
        "name": "facebook.id.foo.john-2",
        "omit_response_on_success": false,
        "relative_url": "some/api?access_token=_DEFAULT_ACCESS_TOKEN_",
      },
      {
        "body": "recipient=%7B%22id%22%3A%22jane%22%7D&id=3",
        "method": "POST",
        "name": "facebook.id.bar.jane-1",
        "omit_response_on_success": false,
        "relative_url": "me/messages?access_token=access_token_bar",
      },
      {
        "body": "recipient=%7B%22id%22%3A%22jojo%22%7D&id=4",
        "method": "POST",
        "name": "facebook.id.baz.jojo-1",
        "omit_response_on_success": false,
        "relative_url": "another/api?access_token=_DEFAULT_ACCESS_TOKEN_",
      },
      {
        "body": "some=app%20settings",
        "method": "POST",
        "omit_response_on_success": false,
        "relative_url": "settins/api?access_token=_APP_ID_%7C_APP_SECRET_",
      },
    ]
  `);
  expect(scope.isDone()).toBe(true);
});

describe('using API result in following request', () => {
  const accomplishRequest = moxy((request, keys, getResult) => ({
    ...request,
    params: {
      ...request.params,
      images: keys.map((k) => ({ id: getResult(k, '$.id') })),
    },
  }));

  const continuousJobs = [
    {
      key: 'foo_thread',
      request: {
        method: 'POST',
        url: '1234567890/media',
        params: {
          type: 'image/jpeg',
          file: '@/pretend/to/upload/a/file.jpg',
        },
      },
      registerResult: 'image_1',
      channel: { uid: 'foo' },
    },
    {
      key: 'foo_thread',
      request: {
        method: 'POST',
        url: '1234567890/media',
        params: {
          type: 'image/jpeg',
          file: '@/pretend/to/upload/b/file.jpg',
        },
      },
      registerResult: 'image_2',
      channel: { uid: 'foo' },
    },
    {
      key: 'foo_thread',
      request: {
        method: 'POST',
        url: '1234567890/messages',
        params: {
          to: '9876543210',
          type: 'image',
          images: [],
        },
      },
      consumeResult: {
        keys: ['image_1', 'image_2'],
        accomplishRequest,
      },
      channel: { uid: 'foo' },
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
    const worker = new MetaApiWorker({
      appId,
      appSecret,
      agentSettingsAccessor,
      graphApiVersion: 'v11.0',
      consumeInterval: 0,
    });
    const apiCall = graphApi
      .post('/v11.0/', bodySpy)
      .reply(200, JSON.stringify(continuousApiResults));

    worker.start(queue);
    await expect(queue.executeJobs(continuousJobs)).resolves.toMatchSnapshot();

    expect(bodySpy).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];
    expect(body).toMatchSnapshot();

    expect(JSON.parse(body.batch).map(decodeBatchedRequest))
      .toMatchInlineSnapshot(`
      [
        {
          "body": "type=image/jpeg&file=@/pretend/to/upload/a/file.jpg",
          "method": "POST",
          "name": "foo_thread-1",
          "omit_response_on_success": false,
          "relative_url": "1234567890/media?access_token=access_token_foo",
        },
        {
          "body": "type=image/jpeg&file=@/pretend/to/upload/b/file.jpg",
          "depends_on": "foo_thread-1",
          "method": "POST",
          "name": "foo_thread-2",
          "omit_response_on_success": false,
          "relative_url": "1234567890/media?access_token=access_token_foo",
        },
        {
          "body": "to=9876543210&type=image&images=[{"id":"{result=foo_thread-1:$.id}"},{"id":"{result=foo_thread-2:$.id}"}]",
          "depends_on": "foo_thread-2",
          "method": "POST",
          "name": "foo_thread-3",
          "omit_response_on_success": false,
          "relative_url": "1234567890/messages?access_token=access_token_foo",
        },
      ]
    `);

    expect(accomplishRequest).toHaveBeenCalledTimes(1);
    expect(accomplishRequest).toHaveBeenCalledWith(
      expect.objectContaining(continuousJobs[2].request),
      ['image_1', 'image_2'],
      expect.any(Function)
    );

    expect(apiCall.isDone()).toBe(true);
  });

  test('when job key is undeinfed', async () => {
    const worker = new MetaApiWorker({
      appId,
      appSecret,
      agentSettingsAccessor,
      graphApiVersion: 'v11.0',
      consumeInterval: 0,
    });
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
      [
        {
          "body": "type=image/jpeg&file=@/pretend/to/upload/a/file.jpg",
          "method": "POST",
          "name": "#request-0",
          "omit_response_on_success": false,
          "relative_url": "1234567890/media?access_token=access_token_foo",
        },
        {
          "body": "type=image/jpeg&file=@/pretend/to/upload/b/file.jpg",
          "method": "POST",
          "name": "#request-1",
          "omit_response_on_success": false,
          "relative_url": "1234567890/media?access_token=access_token_foo",
        },
        {
          "body": "to=9876543210&type=image&images=[{"id":"{result=#request-0:$.id}"},{"id":"{result=#request-1:$.id}"}]",
          "method": "POST",
          "omit_response_on_success": false,
          "relative_url": "1234567890/messages?access_token=access_token_foo",
        },
      ]
    `);

    expect(accomplishRequest).toHaveBeenCalledTimes(1);
    expect(accomplishRequest).toHaveBeenCalledWith(
      expect.objectContaining(continuousJobs[2].request),
      ['image_1', 'image_2'],
      expect.any(Function)
    );

    expect(apiCall.isDone()).toBe(true);
  });

  test('registerResult & consumeResult in different batches', async () => {
    const worker = new MetaApiWorker({
      appId,
      appSecret,
      agentSettingsAccessor,
      graphApiVersion: 'v11.0',
      consumeInterval: 0,
    });
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
          request: { method: 'GET', url: '1234567890' },
          channel: { uid: 'foo' },
        }),
        ...continuousJobs,
      ])
    ).resolves.toMatchSnapshot();

    expect(bodySpy).toHaveBeenCalledTimes(2);
    const body1 = bodySpy.mock.calls[0].args[0];
    const body2 = bodySpy.mock.calls[1].args[0];
    expect(body1).toMatchSnapshot();
    expect(body2).toMatchSnapshot();

    expect(decodeBatchedRequest(JSON.parse(body1.batch)[49]))
      .toMatchInlineSnapshot(`
      {
        "body": "type=image/jpeg&file=@/pretend/to/upload/a/file.jpg",
        "method": "POST",
        "name": "foo_thread-1",
        "omit_response_on_success": false,
        "relative_url": "1234567890/media?access_token=access_token_foo",
      }
    `);
    expect(decodeBatchedRequest(JSON.parse(body2.batch)[0]))
      .toMatchInlineSnapshot(`
      {
        "body": "type=image/jpeg&file=@/pretend/to/upload/b/file.jpg",
        "method": "POST",
        "name": "foo_thread-1",
        "omit_response_on_success": false,
        "relative_url": "1234567890/media?access_token=access_token_foo",
      }
    `);
    expect(decodeBatchedRequest(JSON.parse(body2.batch)[1]))
      .toMatchInlineSnapshot(`
      {
        "body": "to=9876543210&type=image&images=[{"id":"1111111111"},{"id":"{result=foo_thread-1:$.id}"}]",
        "depends_on": "foo_thread-1",
        "method": "POST",
        "name": "foo_thread-2",
        "omit_response_on_success": false,
        "relative_url": "1234567890/messages?access_token=access_token_foo",
      }
    `);

    expect(accomplishRequest).toHaveBeenCalledTimes(1);
    expect(accomplishRequest).toHaveBeenCalledWith(
      expect.objectContaining(continuousJobs[2].request),
      ['image_1', 'image_2'],
      expect.any(Function)
    );

    expect(apiCall1.isDone()).toBe(true);
    expect(apiCall2.isDone()).toBe(true);
  });
});
