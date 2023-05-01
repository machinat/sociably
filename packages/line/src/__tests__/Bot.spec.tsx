import nock from 'nock';
import moxy, { Moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import _Engine from '@sociably/core/engine';
import _Renderer from '@sociably/core/renderer';
import Queue from '@sociably/core/queue';
import { LineBot } from '../Bot';
import LineChannel from '../Channel';
import LineChat from '../Chat';
import LineWorker from '../Worker';
import LineApiError from '../error';
import {
  Expression,
  Image,
  QuickReply,
  MessageAction,
  LinkRichMenu,
} from '../components';

const Renderer = _Renderer as Moxy<typeof _Renderer>;
const Engine = _Engine as Moxy<typeof _Engine>;

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

nock.disableNetConnect();

const initScope = moxy(() => moxy());
const dispatchWrapper = moxy((x) => x);

const channelSettings = {
  providerId: '_PROVIDER_ID_',
  channelId: '_CHANNEL_ID_',
  accessToken: '_ACCESS_TOKEN_',
  channelSecret: '_CHANNEL_SECRET_',
};

const channelSettingsAccessor = moxy({
  getChannelSettings: async () => channelSettings,
  getChannelSettingsBatch: async () => [channelSettings, channelSettings],
  listAllChannelSettings: async () => [channelSettings, channelSettings],
  getLineChatChannelSettingsByBotUserId: async () => channelSettings,
  getLineLoginChannelSettings: async () => null,
});

let lineApi;
beforeEach(() => {
  Engine.mock.reset();
  Renderer.mock.reset();

  nock.cleanAll();
  lineApi = nock('https://api.line.me', {
    reqheaders: {
      'content-type': 'application/json',
      authorization: 'Bearer _ACCESS_TOKEN_',
    },
  });
});

const channel = new LineChannel('_CHANNEL_ID_');

const message = (
  <Expression
    quickReplies={
      <QuickReply>
        <MessageAction text="Hi!" label="HI" />
      </QuickReply>
    }
  >
    Hello <b>LINE</b>
    <Image originalContentUrl="https://..." previewImageUrl="https://..." />
    <LinkRichMenu id="newbie" />
  </Expression>
);

describe('.constructor(options)', () => {
  it('assemble engine', () => {
    const bot = new LineBot({
      channelSettingsAccessor,
      maxRequestConnections: 999,
      initScope,
      dispatchWrapper,
    });

    expect(Renderer).toHaveBeenCalledTimes(1);
    expect(Renderer).toHaveBeenCalledWith('line', expect.any(Function));

    expect(bot.engine).toBeInstanceOf(Engine);
    expect(Engine).toHaveBeenCalledTimes(1);
    expect(Engine).toHaveBeenCalledWith(
      'line',
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(LineWorker),
      initScope,
      dispatchWrapper
    );

    const worker = Engine.mock.calls[0].args[3];
    expect(worker.maxConnections).toBe(999);
  });
});

describe('.render(chat, node, options)', () => {
  it('make api calls', async () => {
    const bot = new LineBot({ channelSettingsAccessor });

    bot.start();

    const apiCall1 = lineApi
      .post('/v2/bot/message/push', {
        to: 'john_doe',
        messages: [
          { text: 'Hello LINE', type: 'text' },
          {
            type: 'image',
            originalContentUrl: 'https://...',
            previewImageUrl: 'https://...',
            quickReply: {
              items: [
                {
                  action: { label: 'HI', text: 'Hi!', type: 'message' },
                  type: 'action',
                },
              ],
            },
          },
        ],
      })
      .reply(200, '{}');
    const apiCall2 = lineApi
      .post('/v2/bot/user/john_doe/richmenu/newbie', '')
      .reply(200, '{}');

    const response = await bot.render(
      new LineChat('_CHANNEL_ID_', 'user', 'john_doe'),
      message
    );

    expect(response).toMatchSnapshot();
    expect(apiCall1.isDone()).toBe(true);
    expect(apiCall2.isDone()).toBe(true);
  });

  it('works with replyToken', async () => {
    const bot = new LineBot({ channelSettingsAccessor });
    bot.start();

    const apiCall1 = lineApi
      .post('/v2/bot/message/reply', {
        replyToken: '__REPLY_TOKEN__',
        messages: [
          { text: 'Hello LINE', type: 'text' },
          {
            type: 'image',
            originalContentUrl: 'https://...',
            previewImageUrl: 'https://...',
            quickReply: {
              items: [
                {
                  type: 'action',
                  action: { label: 'HI', text: 'Hi!', type: 'message' },
                },
              ],
            },
          },
        ],
      })
      .reply(200, '{}');

    const apiCall2 = lineApi
      .post('/v2/bot/user/john_doe/richmenu/newbie', '')
      .reply(200, '{}');

    const response = await bot.render(
      new LineChat('_CHANNEL_ID_', 'user', 'john_doe'),
      message,
      { replyToken: '__REPLY_TOKEN__' }
    );

    expect(response).toMatchSnapshot();
    expect(apiCall1.isDone()).toBe(true);
    expect(apiCall2.isDone()).toBe(true);
  });

  it('return null if message is empty', async () => {
    const bot = new LineBot({ channelSettingsAccessor });

    for (const empty of [null, undefined, [], <></>, true, false]) {
      // eslint-disable-next-line no-await-in-loop
      await expect(
        bot.render(new LineChat('_CHANNEL_ID_', 'user', 'john_doe'), empty)
      ).resolves.toBe(null);
    }
  });
});

describe('.renderMulticast(channel, userIds, message)', () => {
  it('return null if message is empty', async () => {
    const bot = new LineBot({ channelSettingsAccessor });

    for (const empty of [null, undefined, [], <></>, true, false]) {
      // eslint-disable-next-line no-await-in-loop
      await expect(
        bot.renderMulticast(channel, ['no', 'one', 'knows'], empty)
      ).resolves.toBe(null);
    }
  });

  it('make api call to message/mulitcast', async () => {
    const bot = new LineBot({ channelSettingsAccessor });
    bot.start();

    const apiCall1 = lineApi
      .post('/v2/bot/message/multicast', {
        to: ['john', 'wick', 'dog'],
        messages: [
          { text: 'Hello LINE', type: 'text' },
          {
            type: 'image',
            originalContentUrl: 'https://...',
            previewImageUrl: 'https://...',
            quickReply: {
              items: [
                {
                  type: 'action',
                  action: { label: 'HI', text: 'Hi!', type: 'message' },
                },
              ],
            },
          },
        ],
      })
      .reply(200, '{}');

    const apiCall2 = lineApi
      .post('/v2/bot/richmenu/bulk/link', {
        userIds: ['john', 'wick', 'dog'],
        richMenuId: 'newbie',
      })
      .reply(200, '{}');

    const response = await bot.renderMulticast(
      channel,
      ['john', 'wick', 'dog'],
      message
    );

    expect(response).toMatchSnapshot();
    expect(apiCall1.isDone()).toBe(true);
    expect(apiCall2.isDone()).toBe(true);
  });
});

describe('.requestApi(options)', () => {
  it('call line REST api', async () => {
    const bot = new LineBot({ channelSettingsAccessor });
    bot.start();

    const apiCall = lineApi
      .post('/v2/bot/foo', { bar: 'baz' })
      .reply(200, '{"foo":"bar.baz"}');

    await expect(
      bot.requestApi({
        channel,
        method: 'POST',
        url: 'v2/bot/foo',
        params: { bar: 'baz' },
      })
    ).resolves.toEqual({
      foo: 'bar.baz',
    });

    expect(apiCall.isDone()).toBe(true);
  });

  it('throw LineApiError if api call fail', async () => {
    const bot = new LineBot({ channelSettingsAccessor });
    bot.start();

    const apiCall = lineApi
      .post('/v2/bot/foo', { bar: 'baz' })
      .reply(400, { message: 'bad' });

    try {
      await bot.requestApi({
        channel,
        method: 'POST',
        url: 'v2/bot/foo',
        params: { bar: 'baz' },
      });
      expect('should not be here').toBeFalsy();
    } catch (err) {
      expect(err).toBeInstanceOf(LineApiError);
      expect(err.code).toBe(400);
      expect(err.info).toEqual({ message: 'bad' });
    }

    expect(apiCall.isDone()).toBe(true);
  });
});
