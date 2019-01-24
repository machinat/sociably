import moxy from 'moxy';
import nock from 'nock';
import Machinat from 'machinat';
import MesengerClient from '../client';
import {
  MESSENGER_NAITVE_TYPE,
  ATTACHED_FILE_DATA,
  ATTACHED_FILE_INFO,
} from '../../symbol';

nock.disableNetConnect();

const makeResponse = (code, body) => ({
  code,
  body: JSON.stringify(body),
});

const Foo = moxy(props => [props]);
Foo.$$native = MESSENGER_NAITVE_TYPE;
Foo.$$unit = true;

const Bar = moxy(props => [props]);
Bar.$$native = MESSENGER_NAITVE_TYPE;
Bar.$$unit = true;
Bar.$$entry = 'bar/baz';

const msg = (
  <>
    <Foo id={1} />
    <Bar id={2} />
    <Foo id={3} />
  </>
);

let graphAPI;
beforeEach(() => {
  graphAPI = nock('https://graph.facebook.com');
});

afterEach(() => {
  Foo.mock.clear();
  nock.cleanAll();
});

it('sends ok', async () => {
  const accessToken = '_graph_api_access_token_';
  const client = new MesengerClient({ accessToken });

  const thread = { id: 'foo' };
  const promise = client.send(thread, msg);
  expect(promise).toBeInstanceOf(Promise);

  const scope = graphAPI
    .post('/v3.1/', body => {
      expect(body.access_token).toBe(accessToken);
      expect(body.include_headers).toBe('false');

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

  expect(response).toMatchSnapshot();
});

it('attach appsecret_proof if appSecret option given', async () => {
  const accessToken = '_fb_graph_api_access_token_';
  const appSecret = '_fb_app_secret_';
  const expectedProof =
    'c3d9a02ac88561d9721b3cb2ba338c933f0666b68ad29523393b830b3916cd91';

  const client = new MesengerClient({
    accessToken,
    appSecret,
  });

  const scope = graphAPI
    .post('/v3.1/', body => {
      expect(body.access_token).toBe(accessToken);
      expect(body.appsecret_proof).toBe(expectedProof);

      expect(body).toMatchSnapshot();

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
  const response = await client.send({ id: 'foo' }, msg);

  expect(scope.isDone()).toBe(true);

  expect(response).toMatchSnapshot();
});

it('upload files with form data if binary attached on job', async () => {
  Foo.mock.fakeOnce(props => [{ ...props, [ATTACHED_FILE_DATA]: '_file0_' }]);
  Foo.mock.fakeOnce(props => [
    {
      ...props,
      [ATTACHED_FILE_DATA]: '_file1_',
      [ATTACHED_FILE_INFO]: {
        filename: 'YouDontSay.jpg',
        contentType: 'image/jpeg',
        knownLength: 19806,
      },
    },
  ]);

  const client = new MesengerClient({
    accessToken: '_graph_api_access_token_',
  });

  const scope = graphAPI
    .matchHeader('content-type', /multipart\/form-data.*/)
    .post('/v3.1/', body => {
      expect(
        body.replace(/-+[0-9]+/g, '-----MULTIPART_SEPARATOR-----')
      ).toMatchSnapshot();

      const file0Field = new RegExp(
        'Content-Disposition: form-data; name="(?<name>.+)"' +
          '[\\n\\r\\s]+_file0_'
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
      expect(body).toMatch(
        /Content-Disposition: form-data; name="include_headers"[\n\r\s]+false/
      );

      const batch = JSON.parse(
        body.match(
          /Content-Disposition: form-data; name="batch"[\n\r\s]+(.*)[\n\r\s]+-+/
        )[1]
      );

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
  const response = await client.send({ id: 'foo' }, msg);

  expect(scope.isDone()).toBe(true);

  expect(response).toMatchSnapshot();
});

it('throw if connection error happen', async () => {
  const client = new MesengerClient({
    accessToken: '_graph_api_access_token_',
  });

  const scope = graphAPI
    .post('/v3.1/')
    .replyWithError('something wrong like connection error');

  client.startConsumingJob();
  await expect(client.send({ id: 'foo' }, msg)).rejects
    .toThrowErrorMatchingInlineSnapshot(`
"Errors happen while sending:

	FetchError: request to https://graph.facebook.com/v3.1/ failed, reason: something wrong like connection error
    at OverriddenClientRequest.<anonymous> (/Users/LR/Documents/machinat/node_modules/isomorphic-fetch/node_modules/node-fetch/index.js:133:11)
    at OverriddenClientRequest.emit (events.js:182:13)
    at /Users/LR/Documents/machinat/node_modules/nock/lib/request_overrider.js:221:11
    at process._tickCallback (internal/process/next_tick.js:61:11)"
`);

  expect(scope.isDone()).toBe(true);
});

it('throw if api error happen', async () => {
  const client = new MesengerClient({
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
  await expect(client.send({ id: 'foo' }, msg)).rejects
    .toThrowErrorMatchingInlineSnapshot(`
"Errors happen while sending:

	OAuthException: The access token could not be decrypted
    at MessengerClient._defineProperty (/Users/LR/Documents/machinat/packages/machinat-messenger/src/client/client.js:257:13)
    at process._tickCallback (internal/process/next_tick.js:68:7)"
`);

  expect(scope.isDone()).toBe(true);
});

it('throw if one single job fail', async () => {
  const client = new MesengerClient({
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
  await expect(client.send({ id: 'foo' }, msg)).rejects
    .toThrowErrorMatchingInlineSnapshot(`
"Errors happen while sending:

	OAuthException: you should not passed!
    at MessengerClient._defineProperty (/Users/LR/Documents/machinat/packages/machinat-messenger/src/client/client.js:276:20)
    at process._tickCallback (internal/process/next_tick.js:68:7)"
`);

  expect(scope.isDone()).toBe(true);
});
