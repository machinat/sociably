/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Readable } from 'stream';
import moxy, { Moxy } from '@moxyjs/moxy';
import nock from 'nock';
import Sociably from '@sociably/core';
import Queue from '@sociably/core/queue';
import _Engine from '@sociably/core/engine';
import _Renderer from '@sociably/core/renderer';
import _Worker from '../Worker';
import TelegramChat from '../Chat';
import TelegramUser from '../User';
import TelegramApiError from '../Error';
import { TelegramBot } from '../Bot';
import {
  Photo,
  Expression,
  ForceReply,
  EditText,
  EditMedia,
} from '../components';

const Engine = _Engine as Moxy<typeof _Engine>;
const Renderer = _Renderer as Moxy<typeof _Renderer>;
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

jest.mock('../Worker', () =>
  jest.requireActual('@moxyjs/moxy').default(jest.requireActual('../Worker'), {
    mockNewInstance: false,
  })
);

const initScope = moxy(() => moxy());
const dispatchWrapper = moxy((x) => x);

const agentSettings = {
  botToken: '12345:_BOT_TOKEN_',
  botName: 'MyBot',
  secretToken: '_SECRET_TOKEN_',
};

const agentSettingsAccessor = moxy({
  getAgentSettings: async () => agentSettings,
  getAgentSettingsBatch: async () => [],
});

const botUser = new TelegramUser(12345, true);

const message = (
  <Expression replyMarkup={<ForceReply />}>
    Hello <b>World!</b>
    <Photo url="https://sociably.io/greeting.png" />
  </Expression>
);

const telegramApi = nock('https://api.telegram.org');
const bodySpy = moxy(() => true);

beforeEach(() => {
  nock.cleanAll();
  bodySpy.mock.clear();
  Engine.mock.clear();
  Renderer.mock.clear();
  Worker.mock.clear();
});

describe('.constructor(options)', () => {
  it('assemble core modules', () => {
    const bot = new TelegramBot({
      initScope,
      dispatchWrapper,
      agentSettingsAccessor,
      maxRequestConnections: 999,
    });

    expect(bot.engine).toBeInstanceOf(Engine);

    expect(Renderer).toHaveBeenCalledTimes(1);
    expect(Renderer).toHaveBeenCalledWith('telegram', expect.any(Function));

    expect(Engine).toHaveBeenCalledTimes(1);
    expect(Engine).toHaveBeenCalledWith(
      'telegram',
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(Worker),
      initScope,
      dispatchWrapper
    );

    expect(Worker).toHaveBeenCalledTimes(1);
    expect(Worker).toHaveBeenCalledWith(agentSettingsAccessor, 999);
  });

  test('default maxRequestConnections', () => {
    expect(
      new TelegramBot({
        initScope,
        dispatchWrapper,
        agentSettingsAccessor,
      })
    );

    expect(Worker).toHaveBeenCalledTimes(1);
    expect(Worker.mock.calls[0].args).toMatchInlineSnapshot(`
      Array [
        Object {
          "getAgentSettings": [MockFunction moxy(getAgentSettings)],
          "getAgentSettingsBatch": [MockFunction moxy(getAgentSettingsBatch)],
        },
        100,
      ]
    `);
  });
});

test('.start() and .stop() start/stop engine', () => {
  const bot = new TelegramBot({
    initScope,
    dispatchWrapper,
    agentSettingsAccessor,
  });

  type MockEngine = Moxy<TelegramBot['engine']>;

  bot.start();
  expect((bot.engine as MockEngine).start).toHaveBeenCalledTimes(1);

  bot.stop();
  expect((bot.engine as MockEngine).stop).toHaveBeenCalledTimes(1);
});

describe('.render(thread, message, options)', () => {
  const bot = new TelegramBot({ agentSettingsAccessor });

  beforeAll(() => {
    bot.start();
  });

  afterAll(() => {
    bot.stop();
  });

  it('resolves null if message is empty', async () => {
    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      // eslint-disable-next-line no-await-in-loop
      await expect(
        bot.render(new TelegramChat(12345, 67890), empty)
      ).resolves.toBe(null);
    }
  });

  it('send rendered messages to telegram api', async () => {
    const apiCall1 = telegramApi
      .post('/bot12345:_BOT_TOKEN_/sendMessage', bodySpy)
      .reply(200, { ok: true, result: { id: 1 } });
    const apiCall2 = telegramApi
      .post('/bot12345:_BOT_TOKEN_/sendPhoto', bodySpy)
      .reply(200, { ok: true, result: { id: 2 } });

    const response = await bot.render(new TelegramChat(12345, 67890), message);
    expect(response).toMatchSnapshot();

    expect(response!.results).toEqual([
      { ok: true, result: { id: 1 } },
      { ok: true, result: { id: 2 } },
    ]);

    expect(bodySpy).toHaveBeenCalledTimes(2);
    expect(bodySpy.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "chat_id": 67890,
        "parse_mode": "HTML",
        "text": "Hello <b>World!</b>",
      }
    `);
    expect(bodySpy.mock.calls[1].args[0]).toMatchInlineSnapshot(`
      Object {
        "chat_id": 67890,
        "parse_mode": "HTML",
        "photo": "https://sociably.io/greeting.png",
        "reply_markup": Object {
          "force_reply": true,
        },
      }
    `);

    expect(apiCall1.isDone()).toBe(true);
    expect(apiCall2.isDone()).toBe(true);
  });

  test('render global actions without a chat target', async () => {
    const apiCall1 = telegramApi
      .post('/bot12345:_BOT_TOKEN_/editMessageText', bodySpy)
      .reply(200, { ok: true, result: { id: '1' } });
    const apiCall2 = telegramApi
      .post('/bot12345:_BOT_TOKEN_/editMessageMedia', bodySpy)
      .reply(200, { ok: true, result: { id: '2' } });

    const response = await bot.render(
      new TelegramUser(12345, true),
      <>
        <EditText inlineMessageId="1">
          foo <b>bar</b>
        </EditText>
        <EditMedia inlineMessageId="2">
          <Photo url="https://sociably.io/trollface.png" />
        </EditMedia>
      </>
    );
    expect(response!).toMatchSnapshot();
    expect(response!.results).toEqual([
      { ok: true, result: { id: '1' } },
      { ok: true, result: { id: '2' } },
    ]);

    expect(bodySpy).toHaveBeenCalledTimes(2);
    expect(bodySpy.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "inline_message_id": "1",
        "parse_mode": "HTML",
        "text": "foo <b>bar</b>",
      }
    `);
    expect(bodySpy.mock.calls[1].args[0]).toMatchInlineSnapshot(`
      Object {
        "inline_message_id": "2",
        "media": Object {
          "media": "https://sociably.io/trollface.png",
          "parse_mode": "HTML",
          "type": "photo",
        },
      }
    `);

    expect(apiCall1.isDone()).toBe(true);
    expect(apiCall2.isDone()).toBe(true);
  });

  test('render empty message when no chat target', async () => {
    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      // eslint-disable-next-line no-await-in-loop
      await expect(
        bot.render(new TelegramUser(12345, true), empty)
      ).resolves.toBe(null);
    }
  });
});

describe('.requestApi()', () => {
  test('call telegram bot api', async () => {
    const bot = new TelegramBot({
      initScope,
      dispatchWrapper,
      agentSettingsAccessor,
    });
    bot.start();

    const fooCall = telegramApi
      .post('/bot12345:_BOT_TOKEN_/foo', bodySpy)
      .reply(200, {
        ok: true,
        result: { foo: 'bar' },
      });

    await expect(
      bot.requestApi({ agent: botUser, method: 'foo', params: { bar: 'baz' } })
    ).resolves.toEqual({
      foo: 'bar',
    });

    expect(bodySpy).toHaveBeenCalledTimes(1);
    expect(bodySpy).toHaveBeenCalledWith({ bar: 'baz' });

    expect(fooCall.isDone()).toBe(true);
  });

  it('throw TelegramAPIError when fail', async () => {
    const bot = new TelegramBot({
      initScope,
      dispatchWrapper,
      agentSettingsAccessor,
    });
    bot.start();

    const failBody = {
      ok: false,
      error: 'bad',
      error_description: 'really bad',
    };

    const fooCall = telegramApi
      .post('/bot12345:_BOT_TOKEN_/foo', bodySpy)
      .reply(200, failBody);

    try {
      await bot.requestApi({
        agent: botUser,
        method: 'foo',
        params: { bar: 'baz' },
      });
      expect('should not get here').toBeFalsy();
    } catch (error) {
      expect(error).toBeInstanceOf(TelegramApiError);
      expect(error.body).toEqual(failBody);
    }

    expect(bodySpy).toHaveBeenCalledTimes(1);
    expect(bodySpy).toHaveBeenCalledWith({ bar: 'baz' });

    expect(fooCall.isDone()).toBe(true);
  });
});

test('.fetchFile()', async () => {
  const bot = new TelegramBot({
    initScope,
    dispatchWrapper,
    agentSettingsAccessor,
  });
  bot.start();

  const fileId = '_FILE_ID_';

  const getFileCall = telegramApi
    .post('/bot12345:_BOT_TOKEN_/getFile', bodySpy)
    .reply(200, {
      ok: true,
      result: {
        file_id: fileId,
        file_unique_id: '_FILE_UNIQUE_ID_',
        file_path: '_FILE_PATH_',
      },
    });

  const downloadFileCall = telegramApi
    .get('/file/bot12345:_BOT_TOKEN_/_FILE_PATH_', bodySpy)
    .reply(200, '__BINARY_DATA__', {
      'Content-Type': 'image/png',
      'Content-Length': '777',
    });

  const response = await bot.fetchFile(botUser, fileId);

  expect(bodySpy).toHaveBeenCalledTimes(2);
  expect(bodySpy).toHaveBeenNthCalledWith(1, { file_id: fileId });

  expect(response!.content).toBeInstanceOf(Readable);
  expect(response!.contentType).toBe('image/png');
  expect(response!.contentLength).toBe(777);

  await new Promise(setImmediate);
  expect(response!.content.read().toString()).toBe('__BINARY_DATA__');

  expect(getFileCall.isDone()).toBe(true);
  expect(downloadFileCall.isDone()).toBe(true);
});
