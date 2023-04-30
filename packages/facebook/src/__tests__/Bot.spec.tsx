import querystring from 'querystring';
import nock from 'nock';
import moxy, { Moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import _Renderer from '@sociably/core/renderer';
import Queue from '@sociably/core/queue';
import _Engine from '@sociably/core/engine';
import { MetaApiWorker as _Worker, MetaApiError } from '@sociably/meta-api';
import { FacebookBot } from '../Bot';
import { Image, Expression, TextReply } from '../components';
import FacebookChat from '../Chat';
import FacebookPage from '../Page';

const Renderer = _Renderer as Moxy<typeof _Renderer>;
const Engine = _Engine as Moxy<typeof _Engine>;
const Worker = _Worker as Moxy<typeof _Worker>;

nock.disableNetConnect();

jest.mock('@sociably/core/engine', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .default(jest.requireActual('@sociably/core/engine'))
);

jest.mock('@sociably/core/renderer', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .default(jest.requireActual('@sociably/core/renderer'))
);

jest.mock('@sociably/meta-api', () => {
  const module = jest.requireActual('@sociably/meta-api');
  return {
    ...module,
    MetaApiWorker: jest
      .requireActual('@moxyjs/moxy')
      .default(module.MetaApiWorker),
  };
});

const initScope = moxy(() => moxy());
const dispatchWrapper = moxy((x) => x);

const pageId = '1234567890';
const accessToken = '_ACCESS_TOKEN_';
const appSecret = '_APP_SECRET_';

const pageSettingsAccessor = {
  getChannelSettings: async () => ({ pageId, accessToken }),
  getChannelSettingsBatch: async () => [{ pageId, accessToken }],
  listAllChannelSettings: async () => [{ pageId, accessToken }],
};

const page = new FacebookPage(pageId);

const message = (
  <Expression quickReplies={<TextReply title="Hi!" payload="👋" />}>
    Hello <b>World!</b>
    <Image url="https://sociably.io/greeting.png" />
  </Expression>
);

let graphApi;
const bodySpy = moxy(() => true);

beforeEach(() => {
  graphApi = nock('https://graph.facebook.com').post('/v11.0/', bodySpy);
  bodySpy.mock.clear();
  Engine.mock.clear();
  Renderer.mock.clear();
  Worker.mock.clear();
});

afterEach(() => {
  nock.cleanAll();
});

describe('.constructor(options)', () => {
  it('assemble core modules', () => {
    const bot = new FacebookBot({
      pageSettingsAccessor,
      initScope,
      dispatchWrapper,
    });

    expect(bot.engine).toBeInstanceOf(Engine);

    expect(Renderer).toHaveBeenCalledTimes(1);
    expect(Renderer).toHaveBeenCalledWith('facebook', expect.any(Function));

    expect(Engine).toHaveBeenCalledTimes(1);
    expect(Engine).toHaveBeenCalledWith(
      'facebook',
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(Worker),
      initScope,
      dispatchWrapper
    );

    expect(Worker).toHaveBeenCalledTimes(1);
    expect(Worker).toHaveBeenCalledWith(
      pageSettingsAccessor,
      undefined,
      'v11.0',
      500
    );
  });

  it('pass options to worker', () => {
    expect(
      new FacebookBot({
        pageSettingsAccessor,
        initScope,
        dispatchWrapper,
        appSecret,
        graphApiVersion: 'v8.0',
        apiBatchRequestInterval: 0,
      })
    );

    expect(Worker).toHaveBeenCalledTimes(1);
    expect(Worker).toHaveBeenCalledWith(
      pageSettingsAccessor,
      '_APP_SECRET_',
      'v8.0',
      0
    );
  });
});

test('.start() and .stop() start/stop engine', () => {
  const bot = new FacebookBot({
    pageSettingsAccessor,
    initScope,
    dispatchWrapper,
    appSecret,
  });

  type MockEngine = Moxy<FacebookBot['engine']>;

  bot.start();
  expect((bot.engine as MockEngine).start).toHaveBeenCalledTimes(1);

  bot.stop();
  expect((bot.engine as MockEngine).stop).toHaveBeenCalledTimes(1);
});

describe('.message(thread, message, options)', () => {
  const bot = new FacebookBot({ pageSettingsAccessor, appSecret });

  let apiStatus;
  beforeEach(() => {
    const messageResult = {
      code: 200,
      body: JSON.stringify({ message_id: 'xxx', recipient_id: 'xxx' }),
    };
    apiStatus = graphApi.reply(200, [messageResult, messageResult]);
    bot.start();
  });

  afterEach(() => {
    bot.stop();
  });

  const chat = new FacebookChat('1234567890', { id: '9876543210' });

  it('resolves null if message is empty', async () => {
    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      // eslint-disable-next-line no-await-in-loop
      await expect(bot.message(chat, empty)).resolves.toBe(null);
      expect(apiStatus.isDone()).toBe(false);
    }
  });

  it('send messages to me/messages api', async () => {
    const response = await bot.message(chat, message);
    expect(response).toMatchSnapshot();

    for (const result of response!.results) {
      expect(result).toEqual({
        code: 200,
        body: { message_id: 'xxx', recipient_id: 'xxx' },
      });
    }

    expect(bodySpy).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    for (const request of JSON.parse(body.batch)) {
      expect(request.method).toBe('POST');
      expect(request.relative_url).toBe(
        'me/messages?access_token=_ACCESS_TOKEN_'
      );
    }

    expect(body).toMatchSnapshot();
    expect(JSON.parse(body.batch).map((req) => querystring.decode(req.body)))
      .toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "{\\"text\\":\\"Hello World!\\"}",
          "recipient": "{\\"id\\":\\"9876543210\\"}",
        },
        Object {
          "message": "{\\"attachment\\":{\\"type\\":\\"image\\",\\"payload\\":{\\"url\\":\\"https://sociably.io/greeting.png\\"}},\\"quick_replies\\":[{\\"content_type\\":\\"text\\",\\"title\\":\\"Hi!\\",\\"payload\\":\\"👋\\"}]}",
          "recipient": "{\\"id\\":\\"9876543210\\"}",
        },
      ]
    `);

    expect(apiStatus.isDone()).toBe(true);
  });

  test('message options', async () => {
    const response = await bot.message(chat, message, {
      messagingType: 'MESSAGE_TAG',
      tag: 'TRANSPORTATION_UPDATE',
      notificationType: 'SILENT_PUSH',
      personaId: 'billy17',
    });
    expect(response).toMatchSnapshot();

    for (const result of response!.results) {
      expect(result).toEqual({
        code: 200,
        body: { message_id: 'xxx', recipient_id: 'xxx' },
      });
    }

    expect(bodySpy).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    expect(body).toMatchSnapshot();
    expect(JSON.parse(body.batch).map((req) => querystring.decode(req.body)))
      .toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "{\\"text\\":\\"Hello World!\\"}",
          "messaging_type": "MESSAGE_TAG",
          "notification_type": "SILENT_PUSH",
          "persona_id": "billy17",
          "recipient": "{\\"id\\":\\"9876543210\\"}",
          "tag": "TRANSPORTATION_UPDATE",
        },
        Object {
          "message": "{\\"attachment\\":{\\"type\\":\\"image\\",\\"payload\\":{\\"url\\":\\"https://sociably.io/greeting.png\\"}},\\"quick_replies\\":[{\\"content_type\\":\\"text\\",\\"title\\":\\"Hi!\\",\\"payload\\":\\"👋\\"}]}",
          "messaging_type": "MESSAGE_TAG",
          "notification_type": "SILENT_PUSH",
          "persona_id": "billy17",
          "recipient": "{\\"id\\":\\"9876543210\\"}",
          "tag": "TRANSPORTATION_UPDATE",
        },
      ]
    `);

    expect(apiStatus.isDone()).toBe(true);
  });
});

describe('.uploadChatAttachment(message)', () => {
  const bot = new FacebookBot({ pageSettingsAccessor, appSecret });

  beforeEach(() => {
    bot.start();
  });

  afterEach(() => {
    bot.stop();
  });

  it('resolves null if message is empty', async () => {
    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      await expect(bot.uploadChatAttachment(page, empty)).resolves.toBe(null); // eslint-disable-line no-await-in-loop
    }
  });

  it('call message_attachments api', async () => {
    const apiStatus = graphApi.reply(200, [
      { code: 200, body: JSON.stringify({ attachment_id: 401759795 }) },
    ]);

    await expect(
      bot.uploadChatAttachment(
        page,
        <Image url="https://sociably.io/trollface.png" />
      )
    ).resolves.toEqual({ attachmentId: 401759795 });

    expect(bodySpy).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    expect(body).toMatchSnapshot();
    const reqest = JSON.parse(body.batch)[0];
    expect(reqest.method).toBe('POST');
    expect(reqest.relative_url).toBe(
      'me/message_attachments?access_token=_ACCESS_TOKEN_'
    );
    expect(querystring.decode(reqest.body)).toMatchInlineSnapshot(`
      Object {
        "message": "{\\"attachment\\":{\\"type\\":\\"image\\",\\"payload\\":{\\"url\\":\\"https://sociably.io/trollface.png\\"}}}",
      }
    `);

    expect(apiStatus.isDone()).toBe(true);
  });
});

describe('.makeApiCall()', () => {
  it('call facebook graph api', async () => {
    const bot = new FacebookBot({ pageSettingsAccessor });
    bot.start();

    const apiCall = graphApi.reply(200, [{ code: 200, body: '{"foo":"bar"}' }]);

    await expect(
      bot.makeApiCall({
        page,
        method: 'POST',
        path: 'foo',
        params: { bar: 'baz' },
      })
    ).resolves.toEqual({
      foo: 'bar',
    });

    expect(apiCall.isDone()).toBe(true);
  });

  it('throw MetaApiError if api call fail', async () => {
    const bot = new FacebookBot({ pageSettingsAccessor });
    bot.start();

    const apiCall = graphApi.reply(200, [
      {
        code: 400,
        body: JSON.stringify({
          error: {
            message: 'bad',
            type: 'devil',
            code: 444,
            error_subcode: 666,
            fbtrace_id: 'xxxx',
          },
        }),
      },
    ]);

    try {
      await bot.makeApiCall({
        page,
        method: 'POST',
        path: 'foo',
        params: { bar: 'baz' },
      });
      expect('should not be here').toBeFalsy();
    } catch (err) {
      expect(err).toBeInstanceOf(MetaApiError);
      expect(err.code).toBe(444);
      expect(err.message).toBe('bad');
    }

    expect(apiCall.isDone()).toBe(true);
  });
});
