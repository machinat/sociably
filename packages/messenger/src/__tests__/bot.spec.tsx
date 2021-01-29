/* eslint-disable @typescript-eslint/no-non-null-assertion */
import moxy, { Moxy } from '@moxyjs/moxy';
import nock from 'nock';
import Machinat from '@machinat/core';
import _Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import _Engine from '@machinat/core/engine';
import _Worker from '../worker';
import { MessengerBot } from '../bot';
import GraphApiError from '../error';
import { Image, Expression, QuickReply } from '../components';

const Renderer = _Renderer as Moxy<typeof _Renderer>;
const Engine = _Engine as Moxy<typeof _Engine>;
const Worker = _Worker as Moxy<typeof _Worker>;

nock.disableNetConnect();

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
  jest.requireActual('@moxyjs/moxy').default(jest.requireActual('../worker'))
);

const scope = moxy();
const initScope = moxy(() => scope);
const dispatchWrapper = moxy((x) => x);

const pageId = '_PAGE_ID_';
const accessToken = '_ACCESS_TOKEN_';
const appSecret = '_APP_SECRET_';

const message = (
  <Expression quickReplies={<QuickReply title="Hi!" payload="👋" />}>
    Hello <b>World!</b>
    <Image url="https://machinat.com/greeting.png" />
  </Expression>
);

let graphApi;
const bodySpy = moxy(() => true);

beforeEach(() => {
  graphApi = nock('https://graph.facebook.com').post('/v7.0/', bodySpy);
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
      () =>
        new MessengerBot(
          { pageId, appSecret } as never,
          initScope,
          dispatchWrapper
        )
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.accessToken should not be empty"`
    );
  });

  it('throw if pageId not given', () => {
    expect(
      () =>
        new MessengerBot(
          { accessToken, appSecret } as never,
          initScope,
          dispatchWrapper
        )
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.pageId should not be empty"`
    );
  });

  it('assemble core modules', () => {
    const bot = new MessengerBot(
      { pageId, accessToken },
      initScope,
      dispatchWrapper
    );

    expect(bot.engine).toBeInstanceOf(Engine);

    expect(Renderer.mock).toHaveBeenCalledTimes(1);
    expect(Renderer.mock).toHaveBeenCalledWith(
      'messenger',
      expect.any(Function)
    );

    expect(Engine.mock).toHaveBeenCalledTimes(1);
    expect(Engine.mock).toHaveBeenCalledWith(
      'messenger',
      bot,
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(Worker),
      initScope,
      dispatchWrapper
    );

    expect(Worker.mock).toHaveBeenCalledTimes(1);
    expect(Worker.mock).toHaveBeenCalledWith('_ACCESS_TOKEN_', 500, undefined);
  });

  it('pass consumeInterval and appSecret specified to worker', () => {
    expect(
      new MessengerBot(
        { pageId, accessToken, appSecret, consumeInterval: 0 },
        initScope,
        dispatchWrapper
      )
    );

    expect(Worker.mock).toHaveBeenCalledTimes(1);
    expect(Worker.mock).toHaveBeenCalledWith(
      '_ACCESS_TOKEN_',
      0,
      '_APP_SECRET_'
    );
  });
});

test('#start() and #stop() start/stop engine', () => {
  const bot = new MessengerBot(
    { pageId, accessToken, appSecret },
    initScope,
    dispatchWrapper
  );

  type MockEngine = Moxy<MessengerBot['engine']>;

  bot.start();
  expect((bot.engine as MockEngine).start.mock).toHaveBeenCalledTimes(1);

  bot.stop();
  expect((bot.engine as MockEngine).stop.mock).toHaveBeenCalledTimes(1);
});

describe('#render(channel, message, options)', () => {
  const bot = new MessengerBot(
    { pageId, accessToken, appSecret },
    initScope,
    dispatchWrapper
  );

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

  it('resolves null if message is empty', async () => {
    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      // eslint-disable-next-line no-await-in-loop
      await expect(bot.render('john', empty)).resolves.toBe(null);
      expect(apiStatus.isDone()).toBe(false);
    }
  });

  it('send messages to me/messages api', async () => {
    const response = await bot.render('john', message);
    expect(response).toMatchSnapshot();

    for (const result of response!.results) {
      expect(result).toEqual({
        code: 200,
        body: { message_id: 'xxx', recipient_id: 'xxx' },
      });
    }

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    for (const request of JSON.parse(body.batch)) {
      expect(request.method).toBe('POST');
      expect(request.relative_url).toBe('me/messages');
    }

    expect(body).toMatchSnapshot({ batch: expect.any(String) });
    expect(JSON.parse(body.batch)).toMatchSnapshot();

    expect(apiStatus.isDone()).toBe(true);
  });

  test('render options', async () => {
    const response = await bot.render('john', message, {
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

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    expect(body).toMatchSnapshot({ batch: expect.any(String) });
    expect(JSON.parse(body.batch)).toMatchSnapshot();

    expect(apiStatus.isDone()).toBe(true);
  });
});

describe('#renderAttachment(message)', () => {
  const bot = new MessengerBot(
    { pageId, accessToken, appSecret },
    initScope,
    dispatchWrapper
  );

  beforeEach(() => {
    bot.start();
  });

  afterEach(() => {
    bot.stop();
  });

  it('resolves null if message is empty', async () => {
    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      await expect(bot.renderAttachment(empty)).resolves.toBe(null); // eslint-disable-line no-await-in-loop
    }
  });

  it('call message_attachments api', async () => {
    const apiStatus = graphApi.reply(200, [
      { code: 200, body: JSON.stringify({ attachment_id: 401759795 }) },
    ]);

    const response = await bot.renderAttachment(
      <Image url="https://machinat.com/trollface.png" />
    );
    expect(response).toMatchSnapshot();
    expect(response!.results).toEqual([
      {
        code: 200,
        body: { attachment_id: 401759795 },
      },
    ]);

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    expect(body).toMatchSnapshot({ batch: expect.any(String) });
    expect(JSON.parse(body.batch)).toMatchInlineSnapshot(`
      Array [
        Object {
          "body": "message=%7B%22attachment%22%3A%7B%22type%22%3A%22image%22%2C%22payload%22%3A%7B%22url%22%3A%22https%3A%2F%2Fmachinat.com%2Ftrollface.png%22%7D%7D%7D",
          "method": "POST",
          "omit_response_on_success": false,
          "relative_url": "me/message_attachments",
        },
      ]
    `);

    expect(apiStatus.isDone()).toBe(true);
  });
});

describe('#makeApiCall()', () => {
  it('call facebook graph api', async () => {
    const bot = new MessengerBot({ accessToken, pageId });
    bot.start();

    const apiCall = graphApi.reply(200, [{ code: 200, body: '{"foo":"bar"}' }]);

    await expect(
      bot.makeApiCall('POST', 'foo', { bar: 'baz' })
    ).resolves.toEqual({
      foo: 'bar',
    });

    expect(apiCall.isDone()).toBe(true);
  });

  it('throw LineApiError if api call fail', async () => {
    const bot = new MessengerBot({ accessToken, pageId });
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
      await bot.makeApiCall('POST', 'foo', { bar: 'baz' });
      expect('should not be here').toBeFalsy();
    } catch (err) {
      expect(err).toBeInstanceOf(GraphApiError);
      expect(err.code).toBe(444);
      expect(err.message).toBe('bad');
    }

    expect(apiCall.isDone()).toBe(true);
  });
});
