import querystring from 'querystring';
import nock from 'nock';
import moxy, { Moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import _Renderer from '@sociably/core/renderer';
import Queue from '@sociably/core/queue';
import _Engine from '@sociably/core/engine';
import * as MetaApiModule from '@sociably/meta-api';
import { MetaApiWorker as _Worker, MetaApiError } from '@sociably/meta-api';
import { InstagramBot } from '../Bot.js';
import { Image, Expression, TextReply } from '../components/index.js';
import InstagramChat from '../Chat.js';
import InstagramAgent from '../Agent.js';

const Renderer = _Renderer as Moxy<typeof _Renderer>;
const Engine = _Engine as Moxy<typeof _Engine>;
const Worker = _Worker as Moxy<typeof _Worker>;

nock.disableNetConnect();

jest.mock('@sociably/core/engine', () =>
  moxy(jest.requireActual('@sociably/core/engine')),
);

jest.mock('@sociably/core/renderer', () =>
  moxy(jest.requireActual('@sociably/core/renderer')),
);

jest.mock('@sociably/meta-api', () => {
  const module = jest.requireActual<typeof MetaApiModule>('@sociably/meta-api');
  return {
    ...module,
    MetaApiWorker: moxy(module.MetaApiWorker),
  };
});

const initScope = moxy(() => moxy());
const dispatchWrapper = moxy((x) => x);

const accountId = '1234567890';
const pageId = '1111111111';
const accessToken = '_ACCESS_TOKEN_';
const appId = '_APP_ID_';
const appSecret = '_APP_SECRET_';
const username = 'jojodoe666';

const agentSettingsAccessor = {
  getAgentSettings: async () => ({ accountId, pageId, accessToken, username }),
  getAgentSettingsBatch: async () => [
    { accountId, pageId, accessToken, username },
  ],
};

const agent = new InstagramAgent(accountId);

const message = (
  <Expression quickReplies={<TextReply title="Hi!" payload="👋" />}>
    Hello <b>World!</b>
    <Image url="https://sociably.io/greeting.png" />
  </Expression>
);

let graphApi;
const bodySpy = moxy(() => true);

beforeEach(() => {
  graphApi = nock('https://graph.facebook.com').post('/v17.0/', bodySpy);
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
    const bot = new InstagramBot({
      appId,
      appSecret,
      agentSettingsAccessor,
      initScope,
      dispatchWrapper,
    });

    expect(bot.engine).toBeInstanceOf(Engine);

    expect(Renderer).toHaveBeenCalledTimes(1);
    expect(Renderer).toHaveBeenCalledWith('instagram', expect.any(Function));

    expect(Engine).toHaveBeenCalledTimes(1);
    expect(Engine).toHaveBeenCalledWith(
      'instagram',
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(Worker),
      initScope,
      dispatchWrapper,
    );

    expect(Worker).toHaveBeenCalledTimes(1);
    expect(Worker).toHaveBeenCalledWith({
      agentSettingsAccessor,
      appId,
      appSecret,
      graphApiVersion: 'v17.0',
      consumeInterval: 500,
    });
  });

  it('pass options to worker', () => {
    expect(
      new InstagramBot({
        appId,
        appSecret,
        agentSettingsAccessor,
        initScope,
        dispatchWrapper,
        graphApiVersion: 'v8.0',
        apiBatchRequestInterval: 0,
      }),
    );

    expect(Worker).toHaveBeenCalledTimes(1);
    expect(Worker).toHaveBeenCalledWith({
      agentSettingsAccessor,
      appId,
      appSecret,
      graphApiVersion: 'v8.0',
      consumeInterval: 0,
    });
  });
});

test('.start() and .stop() start/stop engine', () => {
  const bot = new InstagramBot({
    appId,
    appSecret,
    agentSettingsAccessor,
    initScope,
    dispatchWrapper,
  });

  bot.start();
  expect(bot.engine.start).toHaveBeenCalledTimes(1);

  bot.stop();
  expect(bot.engine.stop).toHaveBeenCalledTimes(1);
});

describe('.message(thread, message, options)', () => {
  const bot = new InstagramBot({ agentSettingsAccessor, appId, appSecret });

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

  const chat = new InstagramChat('1234567890', { id: '9876543210' });

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
        'me/messages?access_token=_ACCESS_TOKEN_&appsecret_proof=932e1d758c8379099e1b7f9e75e1abf41ab496760d64ddb05e3d21979d13c31f',
      );
    }

    expect(body).toMatchSnapshot();
    expect(JSON.parse(body.batch).map((req) => querystring.decode(req.body)))
      .toMatchInlineSnapshot(`
      [
        {
          "message": "{"text":"Hello World!"}",
          "recipient": "{"id":"9876543210"}",
        },
        {
          "message": "{"attachment":{"type":"image","payload":{"url":"https://sociably.io/greeting.png"}},"quick_replies":[{"content_type":"text","title":"Hi!","payload":"👋"}]}",
          "recipient": "{"id":"9876543210"}",
        },
      ]
    `);

    expect(apiStatus.isDone()).toBe(true);
  });

  test('message options', async () => {
    const response = await bot.message(chat, message, {
      messagingType: 'MESSAGE_TAG',
      tag: 'HUMAN_AGENT',
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
      [
        {
          "message": "{"text":"Hello World!"}",
          "messaging_type": "MESSAGE_TAG",
          "notification_type": "SILENT_PUSH",
          "persona_id": "billy17",
          "recipient": "{"id":"9876543210"}",
          "tag": "HUMAN_AGENT",
        },
        {
          "message": "{"attachment":{"type":"image","payload":{"url":"https://sociably.io/greeting.png"}},"quick_replies":[{"content_type":"text","title":"Hi!","payload":"👋"}]}",
          "messaging_type": "MESSAGE_TAG",
          "notification_type": "SILENT_PUSH",
          "persona_id": "billy17",
          "recipient": "{"id":"9876543210"}",
          "tag": "HUMAN_AGENT",
        },
      ]
    `);

    expect(apiStatus.isDone()).toBe(true);
  });
});

describe('.uploadChatAttachment(agent, message)', () => {
  const bot = new InstagramBot({ agentSettingsAccessor, appId, appSecret });

  beforeEach(() => {
    bot.start();
  });

  afterEach(() => {
    bot.stop();
  });

  it('resolves null if message is empty', async () => {
    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      await expect(bot.uploadChatAttachment(agent, empty)).resolves.toBe(null); // eslint-disable-line no-await-in-loop
    }
  });

  it('call message_attachments api', async () => {
    const apiStatus = graphApi.reply(200, [
      { code: 200, body: JSON.stringify({ attachment_id: 401759795 }) },
    ]);

    await expect(
      bot.uploadChatAttachment(
        agent,
        <Image url="https://sociably.io/trollface.png" />,
      ),
    ).resolves.toEqual({ attachmentId: 401759795 });

    expect(bodySpy).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    expect(body).toMatchSnapshot();
    const reqest = JSON.parse(body.batch)[0];
    expect(reqest.method).toBe('POST');

    expect(reqest.relative_url).toMatchInlineSnapshot(
      `"me/message_attachments?access_token=_ACCESS_TOKEN_&appsecret_proof=932e1d758c8379099e1b7f9e75e1abf41ab496760d64ddb05e3d21979d13c31f"`,
    );
    expect(querystring.decode(reqest.body)).toMatchInlineSnapshot(`
      {
        "message": "{"attachment":{"type":"image","payload":{"url":"https://sociably.io/trollface.png"}}}",
        "platform": "instagram",
      }
    `);

    expect(apiStatus.isDone()).toBe(true);
  });
});

describe('.requestApi(options)', () => {
  it('call facebook graph api', async () => {
    const bot = new InstagramBot({ agentSettingsAccessor, appId, appSecret });
    bot.start();

    const apiCall = graphApi.reply(200, [{ code: 200, body: '{"foo":"bar"}' }]);

    await expect(
      bot.requestApi({
        channel: agent,
        method: 'POST',
        url: 'foo',
        params: { bar: 'baz' },
      }),
    ).resolves.toEqual({ foo: 'bar' });

    expect(apiCall.isDone()).toBe(true);
    expect(bodySpy).toHaveBeenCalledTimes(1);
    expect(bodySpy.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      {
        "access_token": "_ACCESS_TOKEN_",
        "batch": "[{"method":"POST","relative_url":"foo?access_token=_ACCESS_TOKEN_&appsecret_proof=932e1d758c8379099e1b7f9e75e1abf41ab496760d64ddb05e3d21979d13c31f","body":"bar=baz","omit_response_on_success":false}]",
      }
    `);
  });

  test('with accessToken option', async () => {
    const bot = new InstagramBot({ agentSettingsAccessor, appId, appSecret });
    await bot.start();

    graphApi.reply(200, [{ code: 200, body: '{"foo":"bar"}' }]);
    await expect(
      bot.requestApi({
        channel: agent,
        method: 'POST',
        url: 'foo',
        params: { bar: 'baz' },
        accessToken: '_MY_ACCESS_TOKEN_',
      }),
    ).resolves.toEqual({ foo: 'bar' });

    expect(bodySpy.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      {
        "access_token": "_MY_ACCESS_TOKEN_",
        "batch": "[{"method":"POST","relative_url":"foo?access_token=_MY_ACCESS_TOKEN_&appsecret_proof=a2d4a2635b030a35c39f30231ffe768f18af5b034c7be4e095c48495341db374","body":"bar=baz","omit_response_on_success":false}]",
      }
    `);
  });

  test('with asApp option', async () => {
    const bot = new InstagramBot({ agentSettingsAccessor, appId, appSecret });
    await bot.start();

    graphApi.reply(200, [{ code: 200, body: '{"foo":"bar"}' }]);
    await expect(
      bot.requestApi({
        channel: agent,
        method: 'POST',
        url: 'foo',
        params: { bar: 'baz' },
        asApp: true,
      }),
    ).resolves.toEqual({ foo: 'bar' });

    expect(bodySpy.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      {
        "access_token": "_APP_ID_|_APP_SECRET_",
        "batch": "[{"method":"POST","relative_url":"foo?access_token=_APP_ID_%7C_APP_SECRET_&appsecret_proof=b345404c0883034d5e07120293737f58fc94529813075bd0ddb69dc0f0cd4e1b","body":"bar=baz","omit_response_on_success":false}]",
      }
    `);
  });

  it('throw MetaApiError if api call fail', async () => {
    const bot = new InstagramBot({ agentSettingsAccessor, appId, appSecret });
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
      await bot.requestApi({
        channel: agent,
        method: 'POST',
        url: 'foo',
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
