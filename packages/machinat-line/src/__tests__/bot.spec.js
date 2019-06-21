import nock from 'nock';
import moxy from 'moxy';
import Machinat from 'machinat';
import BaseBot from 'machinat-base/src/bot';
import Renderer from 'machinat-renderer';
import WebhookReceiver from 'machinat-webhook-receiver';
import LineBot from '../bot';
import LineWorker from '../worker';
import { LINE_NATIVE_TYPE } from '../constant';

jest.mock('machinat-base/src/bot');

nock.disableNetConnect();

const Foo = moxy((node, _, path) => [
  {
    type: 'unit',
    value: node.props,
    node,
    path,
  },
]);
Foo.$$native = LINE_NATIVE_TYPE;

const Bar = moxy((node, _, path) => [
  {
    type: 'unit',
    value: node.props,
    node,
    path,
  },
]);
Bar.$$native = LINE_NATIVE_TYPE;
Bar.$$getEntry = moxy(() => 'bar');

const Baz = moxy((node, _, path) => [
  {
    type: 'unit',
    value: {},
    node,
    path,
  },
]);
Baz.$$native = LINE_NATIVE_TYPE;
Baz.$$getEntry = moxy(() => 'baz');

const msgs = [
  <Foo id={0} />,
  <Foo id={1} />,
  <Foo id={2} />,
  <Foo id={3} />,
  <Foo id={4} />,
  <Foo id={5} />,
  <Foo id={6} />,
  <Bar id={7} />,
  <Foo id={8} />,
  <Baz id={9} />,
];

const pathSpy = moxy(() => true);
const bodySpy = moxy(() => true);

const accessToken = '__ACCESS_TOKEN__';
let lineAPI;
beforeEach(() => {
  BaseBot.mock.clear();

  Bar.$$getEntry.mock.clear();
  Baz.$$getEntry.mock.clear();

  lineAPI = nock('https://api.line.me', {
    reqheaders: {
      'content-type': 'application/json',
      authorization: 'Bearer __ACCESS_TOKEN__',
    },
  });

  pathSpy.mock.clear();
  bodySpy.mock.clear();
});

it('extends BaseBot', () => {
  expect(
    new LineBot({
      accessToken,
      channelSecret: '_SECRET_',
    })
  ).toBeInstanceOf(BaseBot);
});

it('throws if accessToken not given', () => {
  expect(() => new LineBot()).toThrowErrorMatchingInlineSnapshot(
    `"should provide accessToken to send messenge"`
  );
});

it('throws if shouldValidateRequest but channelSecret not given', () => {
  expect(
    () => new LineBot({ accessToken, shouldValidateRequest: true })
  ).toThrowErrorMatchingInlineSnapshot(
    `"should provide channelSecret if shouldValidateRequest set to true"`
  );
});

it('is ok to have channelSecret empty if shouldValidateRequest set to false', () => {
  expect(
    () => new LineBot({ accessToken, shouldValidateRequest: false })
  ).not.toThrow();
});

it('initiate BaseBot', () => {
  const plugins = [moxy(() => ({})), moxy(() => ({})), moxy(() => ({}))];

  const bot = new LineBot({
    accessToken,
    channelSecret: '_SECRET_',
    plugins,
  });

  expect(bot.plugins).toEqual(plugins);

  expect(BaseBot.mock).toHaveBeenCalledTimes(1);
  expect(BaseBot.mock).toHaveBeenCalledWith(
    'line',
    expect.any(WebhookReceiver),
    expect.any(Renderer),
    expect.any(LineWorker),
    plugins
  );
});

it('sets default options', () => {
  expect(new LineBot({ accessToken, channelSecret: '_SECRET_' }).options)
    .toMatchInlineSnapshot(`
Object {
  "accessToken": "__ACCESS_TOKEN__",
  "channelSecret": "_SECRET_",
  "connectionCapicity": 100,
  "shouldValidateRequest": true,
}
`);
});

it('covers default options', () => {
  const options = {
    accessToken,
    shouldValidateRequest: false,
    channelSecret: '_SECRET_',
    connectionCapicity: 9999,
    useReplyAPI: true,
  };
  expect(new LineBot(options).options).toEqual(options);
});

describe('#send(token, node, options)', () => {
  it('works', async () => {
    const bot = new LineBot({
      accessToken,
      channelSecret: '_SECRET_',
      useReplyAPI: false,
    });

    const apiScope = lineAPI
      .post(pathSpy, bodySpy)
      .times(5)
      .reply(200, '{}');

    const results = await bot.send('john doe', msgs);

    expect(results).toEqual([{}, {}, {}, {}, {}]);
    expect(apiScope.isDone()).toBe(true);

    expect(pathSpy.mock.calls.map(c => c.args[0])).toEqual([
      '/v2/bot/message/push',
      '/v2/bot/message/push',
      '/v2/bot/bar',
      '/v2/bot/message/push',
      '/v2/bot/baz',
    ]);

    expect(bodySpy.mock.calls.map(c => c.args[0])).toMatchSnapshot();
  });

  it('works with replyToken', async () => {
    const bot = new LineBot({
      accessToken,
      channelSecret: '_SECRET_',
      useReplyAPI: true,
    });

    const apiScope = lineAPI.post(pathSpy, bodySpy).reply(200, '{}');

    const results = await bot.send('john doe', msgs.slice(0, 5), {
      replyToken: '__REPLY_TOKEN__',
    });

    expect(results).toEqual([{}]);
    expect(apiScope.isDone()).toBe(true);

    expect(pathSpy.mock.calls[0].args[0]).toEqual('/v2/bot/message/reply');
    expect(bodySpy.mock.calls.map(c => c.args[0])).toMatchSnapshot();
  });

  it('throw if messages length more than 5 when using replyToken', () => {
    const bot = new LineBot({
      accessToken,
      channelSecret: '_SECRET_',
      useReplyAPI: true,
    });

    expect(
      bot.send('john doe', [0, 1, 2, 3, 4, 5], {
        replyToken: '__REPLY_TOKEN__',
      })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"can not send more than 5 messages with a replyToken"`
    );
  });
});

test('#multicast(targets, node) works', async () => {
  const bot = new LineBot({
    accessToken,
    channelSecret: '_SECRET_',
  });

  const apiScope = lineAPI
    .post(pathSpy, bodySpy)
    .times(2)
    .reply(200, '{}');

  const results = await bot.multicast(
    ['john', 'wick', 'dog'],
    msgs.slice(0, 7)
  );

  expect(results).toEqual([{}, {}]);
  expect(apiScope.isDone()).toBe(true);

  expect(pathSpy.mock.calls.map(c => c.args[0])).toEqual([
    '/v2/bot/message/multicast',
    '/v2/bot/message/multicast',
  ]);

  expect(bodySpy.mock.calls.map(c => c.args[0])).toMatchSnapshot();
});
