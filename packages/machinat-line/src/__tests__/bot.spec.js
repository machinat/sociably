/* eslint-disable global-require */
import nock from 'nock';
import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import Engine from '@machinat/core/engine';
import Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import { LineBot } from '../bot';
import LineWorker from '../worker';
import {
  Expression,
  Image,
  QuickReply,
  MessageAction,
  LinkRichMenu,
} from '../components';

jest.mock('@machinat/core/engine', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .default(jest.requireActual('@machinat/core/engine'))
);

jest.mock('@machinat/core/renderer', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .default(jest.requireActual('@machinat/core/renderer'))
);

jest.mock('../worker', () =>
  jest.requireActual('@moxyjs/moxy').default(jest.requireActual('../worker'), {
    mockNewInstance: false,
  })
);

nock.disableNetConnect();

const message = (
  <Expression
    quickReplies={
      <QuickReply action={<MessageAction text="Hi!" label="HI" />} />
    }
  >
    Hello <b>LINE</b>
    <Image url="https://machinat.com/greeting.png" />
    <LinkRichMenu id="newbie" />
  </Expression>
);

const scope = moxy();
const initScope = moxy(() => scope);
const dispatchWrapper = moxy((x) => x);

let lineAPI;
beforeEach(() => {
  Engine.mock.reset();
  Renderer.mock.reset();
  LineWorker.mock.reset();

  nock.cleanAll();
  lineAPI = nock('https://api.line.me', {
    reqheaders: {
      'content-type': 'application/json',
      authorization: 'Bearer _ACCESS_TOKEN_',
    },
  });
});

describe('#constructor(options)', () => {
  it('throw if configs.providerId is empty', () => {
    expect(
      () =>
        new LineBot(
          { accessToken: '_ACCESS_TOKEN_', channelId: '_BOT_CHANNEL_ID_' },
          initScope,
          dispatchWrapper
        )
    ).toThrowErrorMatchingInlineSnapshot(
      `"configs.providerId should not be empty"`
    );
  });

  it('throw if configs.channelId is empty', () => {
    expect(
      () =>
        new LineBot(
          { accessToken: '_ACCESS_TOKEN_', providerId: '_PROVIDER_ID_' },
          initScope,
          dispatchWrapper
        )
    ).toThrowErrorMatchingInlineSnapshot(
      `"configs.channelId should not be empty"`
    );
  });

  it('throws if accessToken not given', () => {
    expect(
      () =>
        new LineBot(
          { providerId: '_PROVIDER_ID_', channelId: '_BOT_CHANNEL_ID_' },
          initScope,
          dispatchWrapper
        )
    ).toThrowErrorMatchingInlineSnapshot(
      `"configs.accessToken should not be empty"`
    );
  });

  it('assemble engine', () => {
    const bot = new LineBot(
      {
        accessToken: '_ACCESS_TOKEN_',
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        connectionCapicity: 999,
      },
      initScope,
      dispatchWrapper
    );

    expect(Renderer.mock).toHaveBeenCalledTimes(1);
    expect(Renderer.mock).toHaveBeenCalledWith('line', expect.any(Function));

    expect(LineWorker.mock).toHaveBeenCalledTimes(1);
    expect(LineWorker.mock).toHaveBeenCalledWith('_ACCESS_TOKEN_', 999);

    expect(bot.engine).toBeInstanceOf(Engine);
    expect(Engine.mock).toHaveBeenCalledTimes(1);
    expect(Engine.mock).toHaveBeenCalledWith(
      'line',
      bot,
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(LineWorker),
      initScope,
      dispatchWrapper
    );
  });

  test('default connectionCapicity', () => {
    const _bot = new LineBot(
      {
        accessToken: '_ACCESS_TOKEN_',
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
      },
      initScope,
      dispatchWrapper
    );

    expect(LineWorker.mock).toHaveBeenCalledTimes(1);
    expect(LineWorker.mock.calls[0].args).toMatchInlineSnapshot(`
      Array [
        "_ACCESS_TOKEN_",
        100,
      ]
    `);
  });
});

describe('#render(token, node, options)', () => {
  it('make api calls', async () => {
    const bot = new LineBot(
      {
        accessToken: '_ACCESS_TOKEN_',
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
      },
      initScope,
      dispatchWrapper
    );

    bot.start();

    const apiCall1 = lineAPI
      .post('/v2/bot/message/push', {
        to: 'john_doe',
        messages: [
          { text: 'Hello LINE', type: 'text' },
          {
            type: 'image',
            originalContentUrl: 'https://machinat.com/greeting.png',
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
    const apiCall2 = lineAPI
      .post('/v2/bot/user/john_doe/richmenu/newbie', '')
      .reply(200, '{}');

    const response = await bot.render('john_doe', message);

    expect(response).toMatchSnapshot();
    expect(apiCall1.isDone()).toBe(true);
    expect(apiCall2.isDone()).toBe(true);
  });

  it('works with replyToken', async () => {
    const bot = new LineBot(
      {
        accessToken: '_ACCESS_TOKEN_',
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
      },
      initScope,
      dispatchWrapper
    );
    bot.start();

    const apiCall1 = lineAPI
      .post('/v2/bot/message/reply', {
        replyToken: '__REPLY_TOKEN__',
        messages: [
          { text: 'Hello LINE', type: 'text' },
          {
            type: 'image',
            originalContentUrl: 'https://machinat.com/greeting.png',
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

    const apiCall2 = lineAPI
      .post('/v2/bot/user/john_doe/richmenu/newbie', '')
      .reply(200, '{}');

    const response = await bot.render('john_doe', message, {
      replyToken: '__REPLY_TOKEN__',
    });

    expect(response).toMatchSnapshot();
    expect(apiCall1.isDone()).toBe(true);
    expect(apiCall2.isDone()).toBe(true);
  });

  it('return null if message is empty', async () => {
    const bot = new LineBot(
      {
        accessToken: '_ACCESS_TOKEN_',
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
      },
      initScope,
      dispatchWrapper
    );

    for (const empty of [null, undefined, [], <></>, true, false]) {
      // eslint-disable-next-line no-await-in-loop
      await expect(bot.render('john_doe', empty)).resolves.toBe(null);
    }
  });

  it('throw if messages length more than 5 when using replyToken', async () => {
    const bot = new LineBot(
      {
        accessToken: '_ACCESS_TOKEN_',
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
      },
      initScope,
      dispatchWrapper
    );
    bot.start();

    await expect(
      bot.render(
        'john_doe',
        <p>
          1<br />2<br />3<br />4<br />5<br />6
        </p>,
        {
          replyToken: '__REPLY_TOKEN__',
        }
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"more then 1 messaging request rendered while using replyToken"`
    );
  });
});

describe('#renderMulticast(targets, node)', () => {
  it('return null if message is empty', async () => {
    const bot = new LineBot(
      {
        accessToken: '_ACCESS_TOKEN_',
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
      },
      initScope,
      dispatchWrapper
    );

    for (const empty of [null, undefined, [], <></>, true, false]) {
      // eslint-disable-next-line no-await-in-loop
      await expect(
        bot.renderMulticast(['no', 'one', 'knows'], empty)
      ).resolves.toBe(null);
    }
  });

  it('make api call to message/mulitcast', async () => {
    const bot = new LineBot(
      {
        accessToken: '_ACCESS_TOKEN_',
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
      },
      initScope,
      dispatchWrapper
    );
    bot.start();

    const apiCall1 = lineAPI
      .post('/v2/bot/message/multicast', {
        to: ['john', 'wick', 'dog'],
        messages: [
          { text: 'Hello LINE', type: 'text' },
          {
            type: 'image',
            originalContentUrl: 'https://machinat.com/greeting.png',
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

    const apiCall2 = lineAPI
      .post('/v2/bot/richmenu/bulk/link', {
        userIds: ['john', 'wick', 'dog'],
        richMenuId: 'newbie',
      })
      .reply(200, '{}');

    const response = await bot.renderMulticast(
      ['john', 'wick', 'dog'],
      message
    );

    expect(response).toMatchSnapshot();
    expect(apiCall1.isDone()).toBe(true);
    expect(apiCall2.isDone()).toBe(true);
  });
});
