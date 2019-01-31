import moxy from 'moxy';
import nock from 'nock';
import Machinat from 'machinat';
import LineClient from '../client';
import { LINE_NAITVE_TYPE } from '../../symbol';

nock.disableNetConnect();

const delay = t => new Promise(resolve => setTimeout(resolve, t));

const accessToken = '__LINE_CHANNEL_TOKEN__';

const Foo = moxy(props => [props]);
Foo.$$native = LINE_NAITVE_TYPE;
Foo.$$unit = true;

const Bar = moxy(props => [props]);
Bar.$$native = LINE_NAITVE_TYPE;
Bar.$$unit = true;
Bar.$$entry = (thread, value) => `${thread.source.userId}/bar/${value.id}`;
Bar.$$hasBody = false;

const Baz = moxy(props => [props]);
Baz.$$native = LINE_NAITVE_TYPE;
Baz.$$unit = true;
Baz.$$entry = (thread, value) => `${thread.source.userId}/baz/${value.id}`;
Baz.$$hasBody = true;

const msg = (
  <>
    <Foo id={1} />
    <Foo id={2} />
    <Foo id={3} />
    <Foo id={4} />
    <Foo id={5} />
    <Foo id={6} />
    <Machinat.Pause />
    <Foo id={7} />
    <Bar id={8} />
    <Foo id={9} />
    <Baz id={10} />
  </>
);

let lineAPI;
beforeEach(() => {
  lineAPI = nock('https://api.line.me', {
    reqheaders: {
      'content-type': 'application/json',
      authorization: 'Bearer __LINE_CHANNEL_TOKEN__',
    },
  });
});

it('pushs message ok', async () => {
  const client = new LineClient({
    accessToken,
    useReplyAPI: false,
    connectionCapicity: 10,
  });

  const thread = { type: 'user', userId: 'john' };
  const promise = client.send(thread, msg);

  const msgScope = lineAPI
    .post('/v2/bot/message/push', body => {
      expect(body.to).toBe('john');
      expect(body.replyToken).toBe(undefined);

      expect(body).toMatchSnapshot();
      return true;
    })
    .times(4)
    .reply(200, '{}');

  const barScope = lineAPI
    .post('/v2/bot/john/bar/8', body => {
      expect(body).toBe('');
      return true;
    })
    .reply(200, '{}');

  const bazScope = lineAPI
    .post('/v2/bot/john/baz/10', body => {
      expect(body).toEqual({ id: 10 });
      return true;
    })
    .reply(200, '{}');

  client.startConsumingJob();
  const response = await promise;

  expect(msgScope.isDone()).toBe(true);
  expect(barScope.isDone()).toBe(true);
  expect(bazScope.isDone()).toBe(true);

  expect(response).toMatchSnapshot();
});

it('reply message ok', async () => {
  const client = new LineClient({
    accessToken,
    useReplyAPI: true,
    connectionCapicity: 10,
  });

  const thread = { type: 'user', userId: 'john' };
  const promise = client.send(thread, msg, { replyToken: '__REPLY_TOKEN__' });

  const msgScope = lineAPI
    .post('/v2/bot/message/reply', body => {
      expect(body.to).toBe(undefined);
      expect(body.replyToken).toBe('__REPLY_TOKEN__');

      expect(body).toMatchSnapshot();
      return true;
    })
    .times(4)
    .reply(200, '{}');

  const barScope = lineAPI
    .post('/v2/bot/john/bar/8', body => {
      expect(body).toBe('');
      return true;
    })
    .reply(200, '{}');

  const bazScope = lineAPI
    .post('/v2/bot/john/baz/10', body => {
      expect(body).toEqual({ id: 10 });
      return true;
    })
    .reply(200, '{}');

  client.startConsumingJob();
  const response = await promise;

  expect(msgScope.isDone()).toBe(true);
  expect(barScope.isDone()).toBe(true);
  expect(bazScope.isDone()).toBe(true);

  expect(response).toMatchSnapshot();
});

it('throw if replyToken not given when useReplyAPI set to true', async () => {
  const client = new LineClient({
    accessToken,
    useReplyAPI: true,
    connectionCapicity: 10,
  });

  const thread = { type: 'user', userId: 'john' };
  expect(client.send(thread, msg)).rejects.toThrowErrorMatchingInlineSnapshot(
    `"replyToken option must be given while sending when useReplyAPI set to true"`
  );
});

it('throw if connection error happen', async () => {
  const client = new LineClient({
    accessToken,
    useReplyAPI: false,
    connectionCapicity: 10,
  });

  const scope = lineAPI
    .post('/v2/bot/message/push')
    .replyWithError('something wrong like connection error');

  client.startConsumingJob();
  await expect(client.send({ type: 'user', userId: 'john' }, msg)).rejects
    .toThrowErrorMatchingInlineSnapshot(`
"Errors happen while sending:
	1) FetchError: request to https://api.line.me/v2/bot/message/push failed, reason: something wrong like connection error"
`);

  expect(scope.isDone()).toBe(true);
});

it('throw if api error happen', async () => {
  const client = new LineClient({
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

  client.startConsumingJob();
  await expect(client.send({ type: 'user', userId: 'john' }, msg)).rejects
    .toThrowErrorMatchingInlineSnapshot(`
"Errors happen while sending:
	1) Bad Request: The request body has 2 error(s): 1. May not be empty, at messages[0].text. 2. Must be one of the following values: [text, image, video, audio, location, sticker, template, imagemap], at messages[1].type."
`);

  expect(scope1.isDone()).toBe(true);
  expect(scope2.isDone()).toBe(true);
});

it('sequently excute jobs of the identica thread', async () => {
  const client = new LineClient({
    accessToken,
    useReplyAPI: false,
    connectionCapicity: 10,
  });

  const bodySpy = moxy(() => true);
  const msgScope = lineAPI
    .post('/v2/bot/message/push', bodySpy)
    .delay(100)
    .times(12)
    .reply(200, '{}');

  const barScope = lineAPI
    .post(/\/v2\/bot\/(john|mary|tony)\/bar\/8/, bodySpy)
    .delay(100)
    .times(3)
    .reply(200, '{}');

  const bazScope = lineAPI
    .post(/\/v2\/bot\/(john|mary|tony)\/baz\/10/, bodySpy)
    .delay(100)
    .times(3)
    .reply(200, '{}');

  client.send({ type: 'user', userId: 'john' }, msg);
  client.send({ type: 'user', userId: 'mary' }, msg);
  client.send({ type: 'user', userId: 'tony' }, msg);

  client.startConsumingJob();
  for (let i = 0; i < 6; i += 1) {
    await delay(100); // eslint-disable-line no-await-in-loop
    expect(bodySpy.mock).toHaveBeenCalledTimes(3 * i + 3);

    if (i !== 3 && i !== 5) {
      expect(bodySpy.mock.calls[3 * i].args[0].to).toBe('john');
      expect(bodySpy.mock.calls[3 * i + 1].args[0].to).toBe('mary');
      expect(bodySpy.mock.calls[3 * i + 2].args[0].to).toBe('tony');
    }
  }

  expect(msgScope.isDone()).toBe(true);
  expect(barScope.isDone()).toBe(true);
  expect(bazScope.isDone()).toBe(true);
});
