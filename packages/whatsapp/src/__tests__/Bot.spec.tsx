import querystring from 'querystring';
import nock from 'nock';
import moxy, { Moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import Queue from '@sociably/core/queue';
import _Renderer from '@sociably/core/renderer';
import _Engine from '@sociably/core/engine';
import { MetaApiWorker as _Worker, MetaApiError } from '@sociably/meta-api';
import WhatsAppAgent from '../Agent.js';
import WhatsAppChat from '../Chat.js';
import { WhatsAppBot } from '../Bot.js';
import { Image, ButtonsTemplate, ReplyButton } from '../components/index.js';

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
jest.mock('@sociably/meta-api', () =>
  moxy(jest.requireActual('@sociably/meta-api'), {
    includeProperties: ['MetaApiWorker'],
  }),
);

const initScope = moxy(() => moxy());
const dispatchWrapper = moxy((x) => x);

const businessNumber = '1234567890';
const accessToken = '_ACCESS_TOKEN_';
const appId = '_APP_ID_';
const appSecret = '_APP_SECRET_';

const message = (
  <ButtonsTemplate
    header={<Image url="http://sociably.com/foo.jpg" />}
    buttons={<ReplyButton title="BAR" data="BAZ" />}
  >
    Hello <b>World!</b>
  </ButtonsTemplate>
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

describe('#constructor(options)', () => {
  it('throw if accessToken not given', () => {
    expect(
      () => new WhatsAppBot({ businessNumber, appSecret } as never),
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.accessToken should not be empty"`,
    );
  });

  it('assemble core modules', () => {
    const bot = new WhatsAppBot({
      appId,
      appSecret,
      initScope,
      dispatchWrapper,
      accessToken,
    });

    expect(bot.engine).toBeInstanceOf(Engine);

    expect(Renderer).toHaveBeenCalledTimes(1);
    expect(Renderer).toHaveBeenCalledWith('whatsapp', expect.any(Function));

    expect(Engine).toHaveBeenCalledTimes(1);
    expect(Engine).toHaveBeenCalledWith(
      'whatsapp',
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(Worker),
      initScope,
      dispatchWrapper,
    );

    expect(Worker).toHaveBeenCalledTimes(1);
    expect(Worker).toHaveBeenCalledWith({
      appId,
      appSecret,
      defaultAccessToken: accessToken,
      graphApiVersion: 'v17.0',
      consumeInterval: 500,
    });
  });

  it('pass options to worker', async () => {
    expect(
      new WhatsAppBot({
        initScope,
        dispatchWrapper,
        accessToken,
        appId,
        appSecret,
        graphApiVersion: 'v8.0',
        apiBatchRequestInterval: 0,
      }),
    );

    expect(Worker).toHaveBeenCalledTimes(1);
    expect(Worker).toHaveBeenCalledWith({
      appId,
      appSecret,
      defaultAccessToken: accessToken,
      graphApiVersion: 'v8.0',
      consumeInterval: 0,
    });
  });
});

test('#start() and #stop() start/stop engine', () => {
  const bot = new WhatsAppBot({
    initScope,
    dispatchWrapper,
    accessToken,
    appId,
    appSecret,
  });

  bot.start();
  expect(bot.engine.start).toHaveBeenCalledTimes(1);

  bot.stop();
  expect(bot.engine.stop).toHaveBeenCalledTimes(1);
});

describe('#render(thread, message, options)', () => {
  const bot = new WhatsAppBot({ accessToken, appId, appSecret });
  const sucessfulResult = {
    messaging_product: 'whatsapp',
    contacts: [{ input: '9876543210', wa_id: '9876543210' }],
    messages: [{ id: 'wamid....' }],
  };

  let apiStatus;
  beforeEach(() => {
    const messageResult = {
      code: 200,
      body: JSON.stringify(sucessfulResult),
    };
    apiStatus = graphApi.reply(200, [messageResult, messageResult]);
    bot.start();
  });

  afterEach(() => {
    bot.stop();
  });

  it('resolves null if message is empty', async () => {
    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      // eslint-disable-next-line no-await-in-loop
      await expect(
        bot.render(new WhatsAppChat('1234567890', '9876543210'), empty),
      ).resolves.toBe(null);
      expect(apiStatus.isDone()).toBe(false);
    }
  });

  it('post to NUMBER/messages api', async () => {
    const response = await bot.render(
      new WhatsAppChat('1234567890', '9876543210'),
      message,
    );
    expect(response).toMatchSnapshot();

    for (const result of response!.results) {
      expect(result).toEqual({
        code: 200,
        body: sucessfulResult,
      });
    }

    expect(bodySpy).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    for (const request of JSON.parse(body.batch)) {
      expect(request.method).toBe('POST');
      expect(request.relative_url).toMatchInlineSnapshot(
        `"1234567890/messages?access_token=_ACCESS_TOKEN_&appsecret_proof=932e1d758c8379099e1b7f9e75e1abf41ab496760d64ddb05e3d21979d13c31f"`,
      );
    }

    expect(body).toMatchSnapshot();
    expect(querystring.decode(JSON.parse(body.batch)[0].body))
      .toMatchInlineSnapshot(`
      {
        "interactive": "{"type":"button","body":{"text":"Hello *World!*"},"header":{"type":"image","image":{"link":"http://sociably.com/foo.jpg"}},"action":{"buttons":[{"type":"reply","reply":{"title":"BAR","id":"BAZ"}}]}}",
        "messaging_product": "whatsapp",
        "to": "9876543210",
        "type": "interactive",
      }
    `);

    expect(apiStatus.isDone()).toBe(true);
  });
});

describe('#uploadMedia(message)', () => {
  const bot = new WhatsAppBot({ accessToken, appId, appSecret });

  beforeEach(() => {
    bot.start();
  });

  afterEach(() => {
    bot.stop();
  });

  it('resolves null if message is empty', async () => {
    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      // eslint-disable-next-line no-await-in-loop
      await expect(
        bot.uploadMedia(new WhatsAppAgent('1234567890'), empty),
      ).resolves.toBe(null);
    }
  });

  it('post /media api', async () => {
    const apiStatus = graphApi.reply(200, [
      { code: 200, body: JSON.stringify({ id: 401759795 }) },
    ]);

    const result = await bot.uploadMedia(
      new WhatsAppAgent('1234567890'),
      <Image file={{ data: Buffer.from('foo'), contentType: 'image/png' }} />,
    );
    expect(result).toEqual({ id: 401759795 });

    expect(bodySpy).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    expect(body.replace(/-----\d+/g, '-----SEPERATOR')).toMatchSnapshot();

    expect(apiStatus.isDone()).toBe(true);
  });
});

describe('#requestApi()', () => {
  it('call facebook graph api', async () => {
    const bot = new WhatsAppBot({ accessToken, appId, appSecret });
    bot.start();

    const apiCall = graphApi.reply(200, [{ code: 200, body: '{"foo":"bar"}' }]);

    await expect(
      bot.requestApi({ method: 'POST', url: 'foo', params: { bar: 'baz' } }),
    ).resolves.toEqual({
      foo: 'bar',
    });

    expect(apiCall.isDone()).toBe(true);
  });

  it('throw MetaApiError if api call fail', async () => {
    const bot = new WhatsAppBot({ accessToken, appId, appSecret });
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
