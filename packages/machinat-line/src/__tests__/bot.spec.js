/* eslint-disable global-require */
import nock from 'nock';
import moxy from 'moxy';
import Machinat from '@machinat/core';
import Engine from '@machinat/core/engine';
import Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import LineBot from '../bot';
import LineWorker from '../worker';
import {
  Dialog,
  Image,
  QuickReply,
  MessageAction,
  LinkRichMenu,
} from '../component';

jest.mock('@machinat/core/engine', () =>
  require('moxy').default(jest.requireActual('@machinat/core/engine'), {
    includeProps: ['default'],
  })
);

jest.mock('@machinat/core/renderer', () =>
  require('moxy').default(jest.requireActual('@machinat/core/renderer'), {
    includeProps: ['default'],
  })
);

jest.mock('../worker', () =>
  require('moxy').default(jest.requireActual('../worker'), {
    includeProps: ['default'],
    mockNewInstance: false,
  })
);

nock.disableNetConnect();

const message = (
  <Dialog
    quickReplies={
      <QuickReply action={<MessageAction text="Hi!" label="HI" />} />
    }
  >
    Hello <b>LINE</b>
    <Image url="https://machinat.com/greeting.png" />
    <LinkRichMenu id="newbie" />
  </Dialog>
);

const pathSpy = moxy(() => true);
const bodySpy = moxy(() => true);

const scope = moxy();
const initScope = moxy(() => scope);
const dispatchWrapper = moxy(x => x);

let lineAPI;
beforeEach(() => {
  Engine.mock.reset();
  Renderer.mock.reset();
  LineWorker.mock.reset();

  nock.cleanAll();
  lineAPI = nock('https://api.line.me', {
    reqheaders: {
      'content-type': 'application/json',
      authorization: 'Bearer __ACCESS_TOKEN__',
    },
  });

  pathSpy.mock.clear();
  bodySpy.mock.clear();
});

describe('#constructor(options)', () => {
  it('throws if accessToken not given', () => {
    expect(
      () => new LineBot({ channelId: '_MY_BOT_' }, initScope, dispatchWrapper)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.accessToken should not be empty"`
    );
  });

  it('throws if channelId not given', () => {
    expect(
      () =>
        new LineBot(
          { accessToken: '__ACCESS_TOKEN__' },
          initScope,
          dispatchWrapper
        )
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.channelId should not be empty"`
    );
  });

  it('assemble engine', () => {
    const bot = new LineBot(
      {
        accessToken: '__ACCESS_TOKEN__',
        channelId: '_MY_BOT_',
        connectionCapicity: 999,
      },
      initScope,
      dispatchWrapper
    );

    expect(Renderer.mock).toHaveBeenCalledTimes(1);
    expect(Renderer.mock).toHaveBeenCalledWith('line', expect.any(Function));

    expect(LineWorker.mock).toHaveBeenCalledTimes(1);
    expect(LineWorker.mock).toHaveBeenCalledWith('__ACCESS_TOKEN__', 999);

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
        accessToken: '__ACCESS_TOKEN__',
        channelId: '_MY_BOT_',
      },
      initScope,
      dispatchWrapper
    );

    expect(LineWorker.mock).toHaveBeenCalledTimes(1);
    expect(LineWorker.mock.calls[0].args).toMatchInlineSnapshot(`
      Array [
        "__ACCESS_TOKEN__",
        100,
      ]
    `);
  });
});

describe('#render(token, node, options)', () => {
  it('make api calls', async () => {
    const bot = new LineBot(
      {
        accessToken: '__ACCESS_TOKEN__',
        channelId: '_MY_BOT_',
      },
      initScope,
      dispatchWrapper
    );

    bot.start();

    const apiStatus = lineAPI
      .post(pathSpy, bodySpy)
      .times(2)
      .reply(200, '{}');

    const response = await bot.render('john_doe', message);

    expect(response).toMatchSnapshot();
    expect(apiStatus.isDone()).toBe(true);

    expect(pathSpy.mock.calls[0].args[0]).toBe('/v2/bot/message/push');
    expect(bodySpy.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "messages": Array [
          Object {
            "text": "Hello LINE",
            "type": "text",
          },
          Object {
            "originalContentUrl": "https://machinat.com/greeting.png",
            "quickReply": Object {
              "items": Array [
                Object {
                  "action": Object {
                    "label": "HI",
                    "text": "Hi!",
                    "type": "message",
                  },
                  "type": "action",
                },
              ],
            },
            "type": "image",
          },
        ],
        "to": "john_doe",
      }
    `);
    expect(pathSpy.mock.calls[1].args[0]).toBe(
      '/v2/bot/user/john_doe/richmenu/newbie'
    );
    expect(bodySpy.mock.calls[1].args[0]).toBe('');
  });

  it('works with replyToken', async () => {
    const bot = new LineBot(
      {
        accessToken: '__ACCESS_TOKEN__',
        channelId: '_MY_BOT_',
      },
      initScope,
      dispatchWrapper
    );
    bot.start();

    const apiStatus = lineAPI
      .post(pathSpy, bodySpy)
      .times(2)
      .reply(200, '{}');

    const response = await bot.render('john_doe', message, {
      replyToken: '__REPLY_TOKEN__',
    });

    expect(response).toMatchSnapshot();
    expect(apiStatus.isDone()).toBe(true);

    expect(pathSpy.mock).toHaveBeenCalledTimes(2);
    expect(bodySpy.mock).toHaveBeenCalledTimes(2);

    expect(pathSpy.mock.calls[0].args[0]).toBe('/v2/bot/message/reply');
    expect(bodySpy.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "messages": Array [
          Object {
            "text": "Hello LINE",
            "type": "text",
          },
          Object {
            "originalContentUrl": "https://machinat.com/greeting.png",
            "quickReply": Object {
              "items": Array [
                Object {
                  "action": Object {
                    "label": "HI",
                    "text": "Hi!",
                    "type": "message",
                  },
                  "type": "action",
                },
              ],
            },
            "type": "image",
          },
        ],
        "replyToken": "__REPLY_TOKEN__",
      }
    `);

    expect(pathSpy.mock.calls[1].args[0]).toBe(
      '/v2/bot/user/john_doe/richmenu/newbie'
    );
    expect(bodySpy.mock.calls[1].args[0]).toBe('');
  });

  it('return null if message is empty', async () => {
    const bot = new LineBot(
      {
        accessToken: '__ACCESS_TOKEN__',
        channelId: '_MY_BOT_',
      },
      initScope,
      dispatchWrapper
    );

    for (const empty of [null, undefined, [], <></>, true, false]) {
      // eslint-disable-next-line no-await-in-loop
      await expect(bot.render('john_doe', empty)).resolves.toBe(null);
    }
  });

  it('throw if messages length more than 5 when using replyToken', () => {
    const bot = new LineBot(
      {
        accessToken: '__ACCESS_TOKEN__',
        channelId: '_MY_BOT_',
      },
      initScope,
      dispatchWrapper
    );
    bot.start();

    expect(
      bot.render(
        'john_doe',
        <text>
          1<br />2<br />3<br />4<br />5<br />6
        </text>,
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
        accessToken: '__ACCESS_TOKEN__',
        channelId: '_MY_BOT_',
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
        accessToken: '__ACCESS_TOKEN__',
        channelId: '_MY_BOT_',
      },
      initScope,
      dispatchWrapper
    );
    bot.start();

    const apiStatus = lineAPI
      .post(pathSpy, bodySpy)
      .times(2)
      .reply(200, '{}');

    const response = await bot.renderMulticast(
      ['john', 'wick', 'dog'],
      message
    );

    expect(response).toMatchSnapshot();
    expect(apiStatus.isDone()).toBe(true);

    expect(pathSpy.mock.calls[0].args[0]).toBe('/v2/bot/message/multicast');
    expect(bodySpy.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "messages": Array [
          Object {
            "text": "Hello LINE",
            "type": "text",
          },
          Object {
            "originalContentUrl": "https://machinat.com/greeting.png",
            "quickReply": Object {
              "items": Array [
                Object {
                  "action": Object {
                    "label": "HI",
                    "text": "Hi!",
                    "type": "message",
                  },
                  "type": "action",
                },
              ],
            },
            "type": "image",
          },
        ],
        "to": Array [
          "john",
          "wick",
          "dog",
        ],
      }
    `);

    expect(pathSpy.mock.calls[1].args[0]).toBe('/v2/bot/richmenu/bulk/link');
    expect(bodySpy.mock.calls[1].args[0]).toMatchInlineSnapshot(`
      Object {
        "richMenuId": "newbie",
        "userIds": Array [
          "john",
          "wick",
          "dog",
        ],
      }
    `);
  });
});
