import moxy from 'moxy';
import nock from 'nock';
import Queue from 'machinat-queue';
import Machinat from '../../../machinat';
import MesengerClient from '../client';
import {
  THREAD_IDENTIFIER,
  ATTACHED_FILE_DATA,
  ATTACHED_FILE_INFO,
} from '../symbol';

const makeResponse = (code, body) => ({
  code,
  body: JSON.stringify(body),
});

const jobBatch = [
  { job: 1, [THREAD_IDENTIFIER]: 'foo' },
  { job: 2, [THREAD_IDENTIFIER]: 'foo' },
  { job: 3, [THREAD_IDENTIFIER]: 'foo' },
];
const renderer = moxy({
  renderJobSequence() {
    return [jobBatch];
  },
});

let graphAPI;

beforeEach(() => {
  graphAPI = nock('https://graph.facebook.com');
});

afterEach(() => {
  nock.cleanAll();
});

it('sends', async () => {
  const queue = moxy(new Queue(), { includeProps: ['executeJobSequence'] });
  const accessToken = '_graph_api_access_token_';
  const client = new MesengerClient(queue, renderer, { accessToken });

  const thread = { id: 'foo' };
  const promise = client.send(thread, <bar />);
  expect(promise).toBeInstanceOf(Promise);

  expect(renderer.renderJobSequence.mock) // prettier-ignore
    .toHaveBeenCalledWith(<bar />, { thread });
  expect(queue.executeJobSequence.mock) // prettier-ignore
    .toHaveBeenCalledWith([jobBatch]);
  expect(queue.length).toBe(3);

  const scope = graphAPI
    .post('/v3.1/', body => {
      expect(body.access_token).toBe(accessToken);
      expect(body.include_headers).toBe('false');

      expect(JSON.parse(body.batch)).toEqual([
        { job: 1, name: 'foo:1', omit_response_on_success: false },
        {
          job: 2,
          depends_on: 'foo:1',
          name: 'foo:2',
          omit_response_on_success: false,
        },
        {
          job: 3,
          depends_on: 'foo:2',
          name: 'foo:3',
          omit_response_on_success: false,
        },
      ]);

      return true;
    })
    .reply(
      200,
      JSON.stringify([
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
      ])
    );

  client.startConsumingJob();
  const response = await promise;

  expect(scope.isDone()).toBe(true);

  response.result.forEach(res => {
    expect(res.code).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      message_id: 'xxx',
      recipient_id: 'xxx',
    });
  });

  expect(response.jobs).toEqual(jobBatch);
});

it('attach appsecret_proof if appSecret option given', async () => {
  const accessToken = '_fb_graph_api_access_token_';
  const appSecret = '_fb_app_secret_';
  const expectedProof =
    'c3d9a02ac88561d9721b3cb2ba338c933f0666b68ad29523393b830b3916cd91';

  const client = new MesengerClient(new Queue(), renderer, {
    accessToken,
    appSecret,
  });

  const scope = graphAPI
    .post('/v3.1/', body => {
      expect(body.access_token).toBe(accessToken);
      expect(body.appsecret_proof).toBe(expectedProof);

      return true;
    })
    .reply(
      200,
      JSON.stringify([
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
      ])
    );

  client.startConsumingJob();
  const response = await client.send({ id: 'foo' }, <bar />);

  expect(scope.isDone()).toBe(true);

  response.result.forEach(res => {
    expect(res.code).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      message_id: 'xxx',
      recipient_id: 'xxx',
    });
  });
  expect(response.jobs).toEqual(jobBatch);
});

it('upload files with form data if binary attached on job', async () => {
  renderer.renderJobSequence.mock.fakeReturnValueOnce([
    [
      { job: 1, [THREAD_IDENTIFIER]: 'foo', [ATTACHED_FILE_DATA]: '_file0_' },
      {
        job: 2,
        [THREAD_IDENTIFIER]: 'foo',
        [ATTACHED_FILE_DATA]: '_file1_',
        [ATTACHED_FILE_INFO]: {
          filename: 'unicycle.jpg',
          contentType: 'image/jpeg',
          knownLength: 19806,
        },
      },
      { job: 3, [THREAD_IDENTIFIER]: 'foo' },
    ],
  ]);

  const client = new MesengerClient(new Queue(), renderer, {
    accessToken: '_graph_api_access_token_',
  });

  const scope = graphAPI
    .matchHeader('content-type', /multipart\/form-data.*/)
    .post('/v3.1/', body => {
      const file0Field = new RegExp(
        'Content-Disposition: form-data; name="(?<name>.+)"' +
          '[\\n\\r\\s]+_file0_'
      ).exec(body);
      const file1Field = new RegExp(
        'Content-Disposition: form-data; name="(?<name>.+)"; filename="unicycle.jpg"' +
          '[\\n\\r\\s]+Content-Type: image/jpeg' +
          '[\\n\\r\\s]+_file1_'
      ).exec(body);

      expect(file0Field).toBeTruthy();
      expect(file1Field).toBeTruthy();

      expect(body).toMatch(
        /Content-Disposition: form-data; name="access_token"[\n\r\s]+_graph_api_access_token_/
      );
      expect(body).toMatch(
        /Content-Disposition: form-data; name="include_headers"[\n\r\s]+false/
      );

      const batch = JSON.parse(
        body.match(
          /Content-Disposition: form-data; name="batch"[\n\r\s]+(.*)[\n\r\s]+-+/
        )[1]
      );

      expect(batch).toEqual([
        {
          job: 1,
          name: 'foo:1',
          omit_response_on_success: false,
          attached_files: file0Field.groups.name,
        },
        {
          job: 2,
          depends_on: 'foo:1',
          name: 'foo:2',
          omit_response_on_success: false,
          attached_files: file1Field.groups.name,
        },
        {
          job: 3,
          depends_on: 'foo:2',
          name: 'foo:3',
          omit_response_on_success: false,
        },
      ]);
      return true;
    })
    .reply(
      200,
      JSON.stringify([
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
      ])
    );

  client.startConsumingJob();
  const response = await client.send({ id: 'foo' }, <bar />);

  expect(scope.isDone()).toBe(true);

  response.result.forEach(res => {
    expect(res.code).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      message_id: 'xxx',
      recipient_id: 'xxx',
    });
  });
});

it('throw if connection error happen', async () => {
  const client = new MesengerClient(new Queue(), renderer, {
    accessToken: '_graph_api_access_token_',
  });

  const scope = graphAPI
    .post('/v3.1/')
    .replyWithError('something wrong like connection error');

  client.startConsumingJob();
  await expect(client.send({ id: 'foo' }, <bar />)).rejects.toThrow(
    'something wrong like connection error'
  );

  expect(scope.isDone()).toBe(true);
});

it('throw if api error happen', async () => {
  const client = new MesengerClient(new Queue(), renderer, {
    accessToken: '_graph_api_access_token_',
  });

  const scope = graphAPI.post('/v3.1/').reply(400, {
    error: {
      message: 'The access token could not be decrypted',
      type: 'OAuthException',
      code: 190,
      fbtrace_id: 'Ecsj7hz8eB0',
    },
  });

  client.startConsumingJob();
  await expect(client.send({ id: 'foo' }, <bar />)).rejects.toThrow(
    'The access token could not be decrypted'
  );

  expect(scope.isDone()).toBe(true);
});

it('throw if one single job fail', async () => {
  const client = new MesengerClient(new Queue(), renderer, {
    accessToken: '_graph_api_access_token_',
  });

  const scope = graphAPI.post('/v3.1/').reply(
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
  client.startConsumingJob();
  await expect(client.send({ id: 'foo' }, <bar />)).rejects.toThrow(
    'you should not passed!'
  );

  expect(scope.isDone()).toBe(true);
});
