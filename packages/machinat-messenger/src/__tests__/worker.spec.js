import moxy from 'moxy';
import nock from 'nock';
import Queue from 'machinat-queue';
import MessengerWorker from '../worker';
import { delay, makeResponse } from './utils';

nock.disableNetConnect();

const jobs = [
  {
    channelId: 'messenger:default:id:foo',
    request: {
      method: 'POST',
      relative_url: 'me/messages',
      body: { recipient: { id: 'foo' }, id: 1 },
    },
  },
  {
    channelId: 'messenger:default:id:foo',
    request: {
      method: 'POST',
      relative_url: 'bar/baz',
      body: { recipient: { id: 'foo' }, id: 2 },
    },
  },
  {
    channelId: 'messenger:default:id:foo',
    request: {
      method: 'POST',
      relative_url: 'me/messages',
      body: { recipient: { id: 'foo' }, id: 3 },
    },
  },
];

let graphAPI;
let queue;
beforeEach(() => {
  graphAPI = nock('https://graph.facebook.com');
  queue = new Queue();
});

afterEach(() => {
  nock.cleanAll();
});

it('sends ok', async () => {
  const accessToken = '_graph_api_access_token_';
  const client = new MessengerWorker({ accessToken });

  const bodySpy = moxy(() => true);

  const scope = graphAPI
    .post('/v3.3/', bodySpy)
    .reply(
      200,
      JSON.stringify([
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
      ])
    );

  client.start(queue);

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

it('attach appsecret_proof if appSecret option given', async () => {
  const accessToken = '_fb_graph_api_access_token_';
  const appSecret = '_fb_app_secret_';
  const expectedProof =
    'c3d9a02ac88561d9721b3cb2ba338c933f0666b68ad29523393b830b3916cd91';

  const client = new MessengerWorker({
    accessToken,
    appSecret,
  });

  const bodySpy = moxy(() => true);

  const scope = graphAPI
    .post('/v3.3/', bodySpy)
    .reply(
      200,
      JSON.stringify([
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
      ])
    );

  client.start(queue);

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

it('upload files with form data if binary attached on job', async () => {
  const client = new MessengerWorker({
    accessToken: '_graph_api_access_token_',
  });

  const bodySpy = moxy(() => true);

  const scope = graphAPI
    .matchHeader('content-type', /multipart\/form-data.*/)
    .post('/v3.3/', bodySpy)
    .reply(
      200,
      JSON.stringify([
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
      ])
    );

  client.start(queue);

  const jobsWithFiles = [
    { ...jobs[0], attachmentFileData: '_file0_' },
    {
      ...jobs[1],
      attachmentFileData: '_file1_',
      attachmentFileInfo: {
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
      { ...jobs[0], attachmentFileData: '_file0_' },
      {
        ...jobs[1],
        attachmentFileData: '_file1_',
        attachmentFileInfo: {
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
    body.replace(/-+[0-9]+/g, '-----MULTIPART_SEPARATOR-----')
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
    /Content-Disposition: form-data; name="access_token"[\n\r\s]+_graph_api_access_token_/
  );

  const batch = JSON.parse(
    body.match(
      /Content-Disposition: form-data; name="batch"[\n\r\s]+(.*)[\n\r\s]+-+/
    )[1]
  );

  expect(batch[0].attached_files).toBe(file0Field[1]);
  expect(batch[1].attached_files).toBe(file1Field[1]);

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
  const client = new MessengerWorker({
    accessToken: '_graph_api_access_token_',
  });

  const scope = graphAPI
    .post('/v3.3/')
    .replyWithError('something wrong like connection error');

  client.start(queue);
  await expect(queue.executeJobs(jobs)).resolves.toMatchInlineSnapshot(`
Object {
  "batch": null,
  "errors": Array [
    [FetchError: request to https://graph.facebook.com/v3.3/ failed, reason: something wrong like connection error],
  ],
  "success": false,
}
`);

  expect(scope.isDone()).toBe(true);
});

it('throw if api error happen', async () => {
  const client = new MessengerWorker({
    accessToken: '_graph_api_access_token_',
  });

  const scope = graphAPI.post('/v3.3/').reply(400, {
    error: {
      message: 'The access token could not be decrypted',
      type: 'OAuthException',
      code: 190,
      fbtrace_id: 'Ecsj7hz8eB0',
    },
  });

  client.start(queue);
  await expect(queue.executeJobs(jobs)).resolves.toMatchInlineSnapshot(`
Object {
  "batch": null,
  "errors": Array [
    [OAuthException: The access token could not be decrypted],
  ],
  "success": false,
}
`);

  expect(scope.isDone()).toBe(true);
});

it('throw if one single job fail', async () => {
  const client = new MessengerWorker({
    accessToken: '_graph_api_access_token_',
  });

  const scope = graphAPI.post('/v3.3/').reply(
    200,
    JSON.stringify([
      makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
      makeResponse(400, {
        error: {
          message: 'you should not passed!',
          type: 'OAuthException',
          code: 999,
          fbtrace_id: 'DuNgzaHdmcb',
        },
      }),
      makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
    ])
  );

  client.start(queue);
  const execRes = await queue.executeJobs(jobs);
  expect(execRes.success).toBe(false);
  expect(execRes).toMatchSnapshot();
  expect(execRes.errors).toMatchInlineSnapshot(`
Array [
  [OAuthException: you should not passed!],
]
`);

  expect(scope.isDone()).toBe(true);
});

it('waits consumeInterval for jobs to execute if set', async () => {
  const client = new MessengerWorker({
    accessToken: '_graph_api_access_token_',
    consumeInterval: 300,
  });

  const bodySpy = moxy(() => true);
  const scope = graphAPI
    .post('/v3.3/', bodySpy)
    .reply(
      200,
      JSON.stringify(
        new Array(9).fill(
          makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' })
        )
      )
    );

  client.start(queue);

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
});

it.each([undefined, 0])(
  'execute immediatly if consumeInterval is %p',
  async consumeInterval => {
    const client = new MessengerWorker({
      accessToken: '_graph_api_access_token_',
      consumeInterval,
    });

    const bodySpy = moxy(() => true);
    const scope = graphAPI
      .post('/v3.3/', bodySpy)
      .times(3)
      .delay(50)
      .reply(
        200,
        JSON.stringify(
          new Array(3).fill(
            makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' })
          )
        )
      );

    client.start(queue);

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
  }
);
