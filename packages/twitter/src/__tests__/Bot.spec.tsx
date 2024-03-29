import Sociably from '@sociably/core';
import { moxy, Moxy } from '@moxyjs/moxy';
import nock from 'nock';
import Queue from '@sociably/core/queue';
import _Engine from '@sociably/core/engine';
import _Renderer from '@sociably/core/renderer';
import _Worker from '../Worker.js';
import TwitterUser from '../User.js';
import TiwtterChat from '../Chat.js';
import TweetTarget from '../TweetTarget.js';
import TwitterBot from '../Bot.js';
import { DirectMessage } from '../components/DirectMessage.js';
import { Photo } from '../components/Media.js';

const Engine = _Engine as Moxy<typeof _Engine>;
const Renderer = _Renderer as Moxy<typeof _Renderer>;
const Worker = _Worker as Moxy<typeof _Worker>;

jest.mock('@sociably/core/engine', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .moxy(jest.requireActual('@sociably/core/engine'))
);
jest.mock('@sociably/core/renderer', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .moxy(jest.requireActual('@sociably/core/renderer'))
);
jest.mock('../Worker.js', () =>
  jest.requireActual('@moxyjs/moxy').moxy(jest.requireActual('../Worker'), {
    mockNewInstance: false,
  })
);

nock.disableNetConnect();

const initScope = moxy(() => moxy());
const dispatchWrapper = moxy((x) => x);

const appKey = '__APP_KEY__';
const appSecret = '__APP_SECRET__';
const bearerToken = '__BEARER_TOKEN__';
const basicOptions = { appKey, appSecret, bearerToken };

const agent = new TwitterUser('1234567890');
const agentSettings = {
  userId: '1234567890',
  accessToken: '1234567890-__ACCESS_TOKEN__',
  tokenSecret: '__ACCESS_SECRET__',
};
const agentSettingsAccessor = {
  getAgentSettings: async () => agentSettings,
  getAgentSettingsBatch: async () => [agentSettings],
};

const twitterApi = nock('https://api.twitter.com');
const bodySpy = moxy(() => true);

beforeEach(() => {
  nock.cleanAll();
  bodySpy.mock.clear();
  Engine.mock.clear();
  Renderer.mock.clear();
  Worker.mock.clear();
});

describe('new TwitterBot(agentSettingsAccessor,options)', () => {
  it('throw if options.appKey is empty', () => {
    expect(
      () =>
        new TwitterBot(agentSettingsAccessor, {
          appSecret,
          bearerToken,
        } as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.appKey should not be empty"`
    );
  });
  it('throw if options.appSecret is empty', () => {
    expect(
      () =>
        new TwitterBot(agentSettingsAccessor, {
          appKey,
          bearerToken,
        } as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.appSecret should not be empty"`
    );
  });
  it('throw if options.bearerToken is empty', () => {
    expect(
      () =>
        new TwitterBot(agentSettingsAccessor, {
          appKey,
          appSecret,
        } as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.bearerToken should not be empty"`
    );
  });

  it('construct engine', () => {
    const bot = new TwitterBot(agentSettingsAccessor, {
      appKey,
      appSecret,
      bearerToken,
      initScope,
      dispatchWrapper,
      maxRequestConnections: 999,
    });

    expect(bot.engine).toBeInstanceOf(Engine);

    expect(Renderer).toHaveBeenCalledTimes(1);
    expect(Renderer).toHaveBeenCalledWith('twitter', expect.any(Function));

    expect(Engine).toHaveBeenCalledTimes(1);
    expect(Engine).toHaveBeenCalledWith(
      'twitter',
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(Worker),
      initScope,
      dispatchWrapper
    );

    expect(Worker).toHaveBeenCalledTimes(1);
    expect(Worker).toHaveBeenCalledWith(agentSettingsAccessor, {
      appKey,
      appSecret,
      bearerToken,
      maxConnections: 999,
    });
  });

  test('default maxConnections', () => {
    expect(new TwitterBot(agentSettingsAccessor, basicOptions));

    expect(Worker).toHaveBeenCalledTimes(1);
    expect(Worker.mock.calls[0].args[1]).toMatchInlineSnapshot(`
      {
        "appKey": "__APP_KEY__",
        "appSecret": "__APP_SECRET__",
        "bearerToken": "__BEARER_TOKEN__",
        "maxConnections": 100,
      }
    `);
  });
});

test('.start() and .stop() start/stop the engine', () => {
  const bot = new TwitterBot(agentSettingsAccessor, basicOptions);

  bot.start();
  expect(bot.engine.start).toHaveBeenCalledTimes(1);

  bot.stop();
  expect(bot.engine.stop).toHaveBeenCalledTimes(1);
});

describe('.render(thread, content)', () => {
  test('post a tweet', async () => {
    const bot = new TwitterBot(agentSettingsAccessor, basicOptions);
    bot.start();

    const createTweetCall = twitterApi
      .post('/2/tweets', bodySpy)
      .times(2)
      .reply(200, { data: { id: '1234567890', text: 'Hello World' } });

    const response = await bot.render(
      new TweetTarget('1234567890'),
      <>
        <p>Hello World</p>
        <p>Foo Bar Baz</p>
      </>
    );
    expect(response?.results).toMatchSnapshot();
    expect(
      response?.jobs.map((job) => ({ ...job, key: '---' }))
    ).toMatchSnapshot();

    expect(bodySpy).toHaveBeenNthCalledWith(1, {
      text: 'Hello World',
    });
    expect(bodySpy).toHaveBeenNthCalledWith(2, {
      text: 'Foo Bar Baz',
      reply: { in_reply_to_tweet_id: '1234567890' },
    });

    expect(createTweetCall.isDone()).toBe(true);
  });

  test('reply to a tweet', async () => {
    const bot = new TwitterBot(agentSettingsAccessor, basicOptions);
    bot.start();

    const createTweetCall = twitterApi
      .post('/2/tweets', bodySpy)
      .times(2)
      .reply(200, { data: { id: '2222222222222', text: 'Hello World' } });

    const response = await bot.render(
      new TweetTarget('1234567890', '1111111111111'),
      <>
        <p>Hello World</p>
        <p>Foo Bar Baz</p>
      </>
    );
    expect(response?.results).toMatchSnapshot();
    expect(
      response?.jobs.map((job) => ({ ...job, key: '---' }))
    ).toMatchSnapshot();

    expect(bodySpy).toHaveBeenNthCalledWith(1, {
      text: 'Hello World',
      reply: { in_reply_to_tweet_id: '1111111111111' },
    });
    expect(bodySpy).toHaveBeenNthCalledWith(2, {
      text: 'Foo Bar Baz',
      reply: { in_reply_to_tweet_id: '2222222222222' },
    });

    expect(createTweetCall.isDone()).toBe(true);
  });

  test('send direct message', async () => {
    const bot = new TwitterBot(agentSettingsAccessor, basicOptions);
    bot.start();

    const createTweetCall = twitterApi
      .post('/1.1/direct_messages/events/new.json', bodySpy)
      .times(2)
      .reply(200, { event: {} });

    const response = await bot.render(
      new TiwtterChat('1234567890', '9876543210'),
      <>
        <p>Hello World</p>
        <p>Foo Bar Baz</p>
      </>
    );
    expect(response).toMatchSnapshot();

    expect(bodySpy).toHaveBeenNthCalledWith(1, {
      event: {
        type: 'message_create',
        message_create: {
          message_data: { text: 'Hello World' },
          target: { recipient_id: '9876543210' },
        },
      },
    });
    expect(bodySpy).toHaveBeenNthCalledWith(2, {
      event: {
        type: 'message_create',
        message_create: {
          message_data: { text: 'Foo Bar Baz' },
          target: { recipient_id: '9876543210' },
        },
      },
    });

    expect(createTweetCall.isDone()).toBe(true);
  });

  test('tweet thread behavior', async () => {
    const bot = new TwitterBot(agentSettingsAccessor, basicOptions);
    bot.start();

    const createTweetCall = twitterApi
      .post('/2/tweets', bodySpy)
      .times(3)
      .reply(200, { data: { id: '2222222222222', text: 'Hello World' } });

    const replyToTweet = new TweetTarget('1234567890', '1111111111111');
    const [response1, response2] = await Promise.all([
      bot.render(replyToTweet, [<p>Foo 1</p>, <p>Bar 2</p>]),
      bot.render(replyToTweet, <p>Baz 3</p>),
    ]);

    expect(bodySpy).toHaveBeenNthCalledWith(1, {
      text: 'Foo 1',
      reply: { in_reply_to_tweet_id: '1111111111111' },
    });
    expect(bodySpy).toHaveBeenNthCalledWith(2, {
      text: 'Baz 3',
      reply: { in_reply_to_tweet_id: '1111111111111' },
    });
    expect(bodySpy).toHaveBeenNthCalledWith(3, {
      text: 'Bar 2',
      reply: { in_reply_to_tweet_id: '2222222222222' },
    });

    expect(response1?.jobs[0].key).toBe(response1?.jobs[1].key);
    expect(response2?.jobs[0].key).not.toBe(response1?.jobs[0].key);

    expect(createTweetCall.isDone()).toBe(true);
  });

  test('chat thread behavior', async () => {
    const bot = new TwitterBot(agentSettingsAccessor, basicOptions);
    bot.start();

    const createTweetCall = twitterApi
      .post('/1.1/direct_messages/events/new.json', bodySpy)
      .times(3)
      .reply(200, { event: {} });

    const chat = new TiwtterChat('1234567890', '9876543210');
    const [response1, response2] = await Promise.all([
      bot.render(chat, [<p>Foo 1</p>, <p>Bar 2</p>]),
      bot.render(chat, <p>Baz 3</p>),
    ]);

    ['Foo 1', 'Bar 2', 'Baz 3'].forEach((text, i) => {
      expect(bodySpy).toHaveBeenNthCalledWith(i + 1, {
        event: {
          type: 'message_create',
          message_create: {
            message_data: { text },
            target: { recipient_id: '9876543210' },
          },
        },
      });
    });

    expect(response1?.jobs[0].key).toBe(response1?.jobs[1].key);
    expect(response2?.jobs[0].key).toBe(response1?.jobs[0].key);

    expect(createTweetCall.isDone()).toBe(true);
  });
});

describe('.requestApi(method, uri, params)', () => {
  test('GET request', async () => {
    const bot = new TwitterBot(agentSettingsAccessor, basicOptions);
    bot.start();

    const apiCall = twitterApi
      .get('/2/foo?a=0&b=1')
      .reply(200, { data: { id: '11111' } });

    await expect(
      bot.requestApi({
        agent,
        method: 'GET',
        url: '2/foo',
        params: { a: 0, b: 1 },
      })
    ).resolves.toEqual({ data: { id: '11111' } });

    expect(apiCall.isDone()).toBe(true);
  });

  test('POST request', async () => {
    const bot = new TwitterBot(agentSettingsAccessor, basicOptions);
    bot.start();

    const apiCall = twitterApi
      .post('/2/foo', { a: 0, b: 1 })
      .reply(200, { data: { id: '11111' } });

    await expect(
      bot.requestApi({
        agent,
        method: 'POST',
        url: '2/foo',
        params: { a: 0, b: 1 },
      })
    ).resolves.toEqual({ data: { id: '11111' } });

    expect(apiCall.isDone()).toBe(true);
  });

  test('with asApplication option', async () => {
    const bot = new TwitterBot(agentSettingsAccessor, basicOptions);
    bot.start();

    const apiCall = twitterApi
      .post(
        '/2/foo',
        { a: 0, b: 1 },
        { reqheaders: { Authorization: 'Bearer __BEARER_TOKEN__' } }
      )
      .reply(200, { data: { id: '11111' } });

    await expect(
      bot.requestApi({
        agent,
        method: 'POST',
        url: '2/foo',
        params: { a: 0, b: 1 },
        asApplication: true,
      })
    ).resolves.toEqual({ data: { id: '11111' } });

    expect(apiCall.isDone()).toBe(true);
  });
});

describe('.uploadMedia(media)', () => {
  test('render and upload media', async () => {
    let initMediaCount = 1;
    const uploadCall = nock('https://upload.twitter.com')
      .post('/1.1/media/upload.json', bodySpy)
      .times(6)
      .reply(
        200,
        (_, body) => {
          const id =
            body.indexOf('INIT') !== -1
              ? new Array(18).fill(`${initMediaCount++}`).join('') // eslint-disable-line no-plusplus
              : /(1{18}|2{18})/.exec(body as string)?.[0];
          return `{"media_id":${id},"media_id_string":"${id}"}`;
        },
        { 'content-type': 'application/json' }
      );

    const externalMediaFileCall = nock('https://sociably.io')
      .get('/img/foo.jpg')
      .reply(200, '__FILE_CONTENT_FROM_EXTERNAL_URL__', {
        'content-type': 'image/jpg',
        'content-length': '34',
      });

    const bot = new TwitterBot(agentSettingsAccessor, basicOptions);

    await expect(
      bot.uploadMedia(
        agent,
        <>
          <Photo shared url="https://sociably.io/img/foo.jpg" />
          <Photo
            fileData={Buffer.from('foo')}
            fileSize={3}
            fileType="image/jpg"
          />
        </>
      )
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "id": "222222222222222222",
          "result": {
            "media_id": 222222222222222222n,
            "media_id_string": "222222222222222222",
          },
          "source": {
            "params": {
              "additional_owners": undefined,
              "media_category": undefined,
              "shared": "true",
            },
            "type": "url",
            "url": "https://sociably.io/img/foo.jpg",
          },
          "type": "photo",
        },
        {
          "id": "111111111111111111",
          "result": {
            "media_id": 111111111111111111n,
            "media_id_string": "111111111111111111",
          },
          "source": {
            "assetTag": undefined,
            "fileData": {
              "data": [
                102,
                111,
                111,
              ],
              "type": "Buffer",
            },
            "params": {
              "additional_owners": undefined,
              "media_category": undefined,
              "media_type": "image/jpg",
              "shared": undefined,
              "total_bytes": 3,
            },
            "type": "file",
          },
          "type": "photo",
        },
      ]
    `);

    expect(uploadCall.isDone()).toBe(true);
    expect(externalMediaFileCall.isDone()).toBe(true);
  });

  it('throw if the non media content received', async () => {
    const bot = new TwitterBot(agentSettingsAccessor, basicOptions);

    await expect(
      bot.uploadMedia(agent, 'foo')
    ).rejects.toThrowErrorMatchingInlineSnapshot(`""foo" is not media"`);
    await expect(
      bot.uploadMedia(agent, <Sociably.Pause />)
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"<Pause /> is not media"`);
    await expect(
      bot.uploadMedia(agent, <DirectMessage>foo</DirectMessage>)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"<DirectMessage /> is not media"`
    );
  });

  it('return null if the node is empty', async () => {
    const bot = new TwitterBot(agentSettingsAccessor, basicOptions);

    await expect(bot.uploadMedia(agent, <>{null}</>)).resolves.toBe(null);
  });
});

describe('.createWelcomeMessage(name, message)', () => {
  test('create welcome message', async () => {
    const bot = new TwitterBot(agentSettingsAccessor, basicOptions);
    bot.start();

    const createWelcomeCall = twitterApi
      .post('/1.1/direct_messages/welcome_messages/new.json', bodySpy)
      .reply(200, {
        welcome_message: {
          id: '844385345234',
          created_timestamp: '1470182274821',
          name: 'foo_welcome',
          message_data: { text: 'Foo!' },
        },
      });

    await expect(
      bot.createWelcomeMessage(
        agent,
        'foo_welcome',
        <DirectMessage>Foo!</DirectMessage>
      )
    ).resolves.toMatchInlineSnapshot(`
      {
        "welcome_message": {
          "created_timestamp": "1470182274821",
          "id": "844385345234",
          "message_data": {
            "text": "Foo!",
          },
          "name": "foo_welcome",
        },
      }
    `);

    expect(bodySpy).toHaveBeenCalledTimes(1);
    expect(bodySpy).toHaveBeenCalledWith({
      welcome_message: {
        name: 'foo_welcome',
        message_data: { text: 'Foo!' },
      },
    });
    expect(createWelcomeCall.isDone()).toBe(true);
  });

  test('return null if content is empty', async () => {
    const bot = new TwitterBot(agentSettingsAccessor, basicOptions);
    bot.start();

    await expect(
      bot.createWelcomeMessage(agent, 'foo_welcome', null)
    ).resolves.toBe(null);
  });
});

test('.fetchMediaFile(url) fetch file with twitter oauth', async () => {
  const authSpy = moxy(() => true);
  const mediaContent = Buffer.from('__MEDIA_CONTENT__');
  const mediaFileApi = nock('https://ton.twitter.com', {
    reqheaders: { authorization: authSpy },
  })
    .get(
      '/1.1/ton/data/dm/1034828552951160836/1034828533812486145/oP5p359h.jpg'
    )
    .reply(200, mediaContent, {
      'content-type': 'image/jpeg',
      'content-length': '17',
    });

  const bot = new TwitterBot(agentSettingsAccessor, basicOptions);

  const response = await bot.fetchMediaFile(
    agent,
    'https://ton.twitter.com/1.1/ton/data/dm/1034828552951160836/1034828533812486145/oP5p359h.jpg'
  );

  expect(response.contentType).toBe('image/jpeg');
  expect(response.contentLength).toBe(17);

  let content;
  await new Promise((resolve) => {
    response.content.on('end', resolve);
    response.content.on('data', (data) => {
      content = data;
    });
  });

  expect(authSpy).toHaveBeenCalledTimes(1);
  expect(
    authSpy.mock.calls[0].args[0]
      .replace(/oauth_nonce="[^"]+"/, 'oauth_nonce="_NONCE_"')
      .replace(/oauth_timestamp="\d+"/, 'oauth_timestamp="1234567890"')
      .replace(/oauth_signature="[^"]+"/, 'oauth_signature="_SIGNATURE_"')
  ).toMatchInlineSnapshot(
    `"OAuth oauth_consumer_key="__APP_KEY__",oauth_nonce="_NONCE_",oauth_signature_method="HMAC-SHA1",oauth_timestamp="1234567890",oauth_token="1234567890-__ACCESS_TOKEN__",oauth_version="1.0",oauth_signature="_SIGNATURE_""`
  );

  expect(content).toEqual(mediaContent);
  expect(mediaFileApi.isDone()).toBe(true);
});
