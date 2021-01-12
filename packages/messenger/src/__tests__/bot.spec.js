import moxy from '@moxyjs/moxy';
import nock from 'nock';
import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import Engine from '@machinat/core/engine';
import Worker from '../worker';
import { MessengerBot } from '../bot';
import { Image, Expression, QuickReply } from '../components';

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

const message = (
  <Expression quickReplies={<QuickReply title="Hi!" />}>
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
          { pageId: '_PAGE_ID_', appSecret: '_SECRET_' },
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
          { accessToken: '_ACCESS_TOKEN_', appSecret: '_SECRET_' },
          initScope,
          dispatchWrapper
        )
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.pageId should not be empty"`
    );
  });

  it('assemble core modules', () => {
    const bot = new MessengerBot(
      { pageId: '_PAGE_ID_', accessToken: '_ACCESS_TOKEN_' },
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
    const _bot = new MessengerBot(
      {
        pageId: '_PAGE_ID_',
        accessToken: '_ACCESS_TOKEN_',
        appSecret: '_APP_SECRET_',
        consumeInterval: 0,
      },
      initScope,
      dispatchWrapper
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
    {
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_APP_SECRET_',
    },
    initScope,
    dispatchWrapper
  );

  bot.start();
  expect(bot.engine.start.mock).toHaveBeenCalledTimes(1);

  bot.stop();
  expect(bot.engine.stop.mock).toHaveBeenCalledTimes(1);
});

describe('#render(channel, message, options)', () => {
  const bot = new MessengerBot(
    {
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
    },
    initScope,
    dispatchWrapper
  );

  let apiStatus;
  beforeEach(() => {
    apiStatus = graphApi.reply(
      200,
      JSON.stringify(
        new Array(2).fill(0).map(() => ({
          code: 200,
          body: JSON.stringify({ message_id: 'xxx', recipient_id: 'xxx' }),
        }))
      )
    );
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

  it('works', async () => {
    const response = await bot.render('john', message);
    expect(response).toMatchSnapshot();

    for (const result of response.results) {
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

  it('works with options', async () => {
    const response = await bot.render('john', message, {
      messagingType: 'TAG',
      tag: 'TRANSPORTATION_UPDATE',
      notificationType: 'SILENT_PUSH',
      personaId: 'billy17',
    });
    expect(response).toMatchSnapshot();

    for (const result of response.results) {
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
    {
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
    },
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

  it('works', async () => {
    const apiStatus = graphApi.reply(
      200,
      JSON.stringify([
        { code: 200, body: JSON.stringify({ attachment_id: 401759795 }) },
      ])
    );

    const response = await bot.renderAttachment(
      <Image sharable url="https://machinat.com/trollface.png" />
    );
    expect(response).toMatchSnapshot();
    expect(response.results).toEqual([
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
