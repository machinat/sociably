import Sociably from '@sociably/core';
import moxy, { Moxy } from '@moxyjs/moxy';
import nock from 'nock';
import Queue from '@sociably/core/queue';
import _Engine from '@sociably/core/engine';
import _Renderer from '@sociably/core/renderer';
import _Worker from '../Worker';
import DirectMessageChat from '../Chat';
import TweetTarget from '../TweetTarget';
import TwitterBot from '../Bot';
import { DirectMessage } from '../components/DirectMessage';
import { Photo } from '../components/Media';

const Engine = _Engine as Moxy<typeof _Engine>;
const Renderer = _Renderer as Moxy<typeof _Renderer>;
const Worker = _Worker as Moxy<typeof _Worker>;

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

nock.disableNetConnect();

const initScope = moxy(() => moxy());
const dispatchWrapper = moxy((x) => x);

const appKey = '__APP_KEY__';
const appSecret = '__APP_SECRET__';
const accessToken = '1234567890-__ACCESS_TOKEN__';
const accessSecret = '__ACCESS_SECRET__';
const bearerToken = '__BEARER_TOKEN__';
const authOptions = {
  appKey,
  appSecret,
  bearerToken,
  accessToken,
  accessSecret,
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

describe('new TwitterBot(options)', () => {
  it('throw if options.appKey is empty', () => {
    expect(
      () =>
        new TwitterBot({
          appSecret,
          bearerToken,
          accessToken,
          accessSecret,
        } as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.appKey should not be empty"`
    );
  });
  it('throw if options.appSecret is empty', () => {
    expect(
      () =>
        new TwitterBot({
          appKey,
          bearerToken,
          accessToken,
          accessSecret,
        } as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.appSecret should not be empty"`
    );
  });
  it('throw if options.bearerToken is empty', () => {
    expect(
      () =>
        new TwitterBot({
          appKey,
          appSecret,
          accessToken,
          accessSecret,
        } as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.bearerToken should not be empty"`
    );
  });
  it('throw if options.accessToken is empty', () => {
    expect(
      () =>
        new TwitterBot({
          appKey,
          appSecret,
          bearerToken,
          accessSecret,
        } as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.accessToken should not be empty"`
    );
  });
  it('throw if options.accessSecret is empty', () => {
    expect(
      () =>
        new TwitterBot({ appKey, appSecret, bearerToken, accessToken } as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.accessSecret should not be empty"`
    );
  });

  it('construct engine', () => {
    const bot = new TwitterBot({
      ...authOptions,
      initScope,
      dispatchWrapper,
      maxRequestConnections: 999,
    });

    expect(bot.engine).toBeInstanceOf(Engine);

    expect(Renderer.mock).toHaveBeenCalledTimes(1);
    expect(Renderer.mock).toHaveBeenCalledWith('twitter', expect.any(Function));

    expect(Engine.mock).toHaveBeenCalledTimes(1);
    expect(Engine.mock).toHaveBeenCalledWith(
      'twitter',
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(Worker),
      initScope,
      dispatchWrapper
    );

    expect(Worker.mock).toHaveBeenCalledTimes(1);
    expect(Worker.mock).toHaveBeenCalledWith({
      appKey,
      appSecret,
      bearerToken,
      accessToken,
      accessSecret,
      maxConnections: 999,
    });
  });

  test('default maxConnections', () => {
    expect(new TwitterBot(authOptions));

    expect(Worker.mock).toHaveBeenCalledTimes(1);
    expect(Worker.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      Object {
        "accessSecret": "__ACCESS_SECRET__",
        "accessToken": "1234567890-__ACCESS_TOKEN__",
        "appKey": "__APP_KEY__",
        "appSecret": "__APP_SECRET__",
        "bearerToken": "__BEARER_TOKEN__",
        "maxConnections": 100,
      }
    `);
  });
});

test('.start() and .stop() start/stop the engine', () => {
  const bot = new TwitterBot(authOptions);

  type MockEngine = Moxy<TwitterBot['engine']>;

  bot.start();
  expect((bot.engine as MockEngine).start.mock).toHaveBeenCalledTimes(1);

  bot.stop();
  expect((bot.engine as MockEngine).stop.mock).toHaveBeenCalledTimes(1);
});

describe('.render(channel, content)', () => {
  test('post a tweet', async () => {
    const bot = new TwitterBot(authOptions);
    bot.start();

    const createTweetCall = twitterApi
      .post('/2/tweets', bodySpy)
      .times(2)
      .reply(200, { data: { id: '1234567890', text: 'Hello World' } });

    const response = await bot.render(
      null,
      <>
        <p>Hello World</p>
        <p>Foo Bar Baz</p>
      </>
    );
    expect(response?.results).toMatchSnapshot();
    expect(
      response?.jobs.map((job) => ({ ...job, key: '---' }))
    ).toMatchSnapshot();

    expect(bodySpy.mock).toHaveBeenNthCalledWith(1, {
      text: 'Hello World',
    });
    expect(bodySpy.mock).toHaveBeenNthCalledWith(2, {
      text: 'Foo Bar Baz',
      reply: { in_reply_to_tweet_id: '1234567890' },
    });

    expect(createTweetCall.isDone()).toBe(true);
  });

  test('reply to a tweet', async () => {
    const bot = new TwitterBot(authOptions);
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

    expect(bodySpy.mock).toHaveBeenNthCalledWith(1, {
      text: 'Hello World',
      reply: { in_reply_to_tweet_id: '1111111111111' },
    });
    expect(bodySpy.mock).toHaveBeenNthCalledWith(2, {
      text: 'Foo Bar Baz',
      reply: { in_reply_to_tweet_id: '2222222222222' },
    });

    expect(createTweetCall.isDone()).toBe(true);
  });

  test('send direct message', async () => {
    const bot = new TwitterBot(authOptions);
    bot.start();

    const createTweetCall = twitterApi
      .post('/1.1/direct_messages/events/new.json', bodySpy)
      .times(2)
      .reply(200, { event: {} });

    const response = await bot.render(
      new DirectMessageChat('1234567890', '9876543210'),
      <>
        <p>Hello World</p>
        <p>Foo Bar Baz</p>
      </>
    );
    expect(response).toMatchSnapshot();

    expect(bodySpy.mock).toHaveBeenNthCalledWith(1, {
      event: {
        type: 'message_create',
        message_create: {
          message_data: { text: 'Hello World' },
          target: { recipient_id: '9876543210' },
        },
      },
    });
    expect(bodySpy.mock).toHaveBeenNthCalledWith(2, {
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
    const bot = new TwitterBot(authOptions);
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

    expect(bodySpy.mock).toHaveBeenNthCalledWith(1, {
      text: 'Foo 1',
      reply: { in_reply_to_tweet_id: '1111111111111' },
    });
    expect(bodySpy.mock).toHaveBeenNthCalledWith(2, {
      text: 'Baz 3',
      reply: { in_reply_to_tweet_id: '1111111111111' },
    });
    expect(bodySpy.mock).toHaveBeenNthCalledWith(3, {
      text: 'Bar 2',
      reply: { in_reply_to_tweet_id: '2222222222222' },
    });

    expect(response1?.jobs[0].key).toBe(response1?.jobs[1].key);
    expect(response2?.jobs[0].key).not.toBe(response1?.jobs[0].key);

    expect(createTweetCall.isDone()).toBe(true);
  });

  test('chat thread behavior', async () => {
    const bot = new TwitterBot(authOptions);
    bot.start();

    const createTweetCall = twitterApi
      .post('/1.1/direct_messages/events/new.json', bodySpy)
      .times(3)
      .reply(200, { event: {} });

    const chat = new DirectMessageChat('1234567890', '9876543210');
    const [response1, response2] = await Promise.all([
      bot.render(chat, [<p>Foo 1</p>, <p>Bar 2</p>]),
      bot.render(chat, <p>Baz 3</p>),
    ]);

    ['Foo 1', 'Bar 2', 'Baz 3'].forEach((text, i) => {
      expect(bodySpy.mock).toHaveBeenNthCalledWith(i + 1, {
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

describe('.makeApiCall(method, uri, params)', () => {
  test('GET request', async () => {
    const bot = new TwitterBot(authOptions);
    bot.start();

    const apiCall = twitterApi
      .get('/2/foo?a=0&b=1')
      .reply(200, { data: { id: '11111' } });

    await expect(
      bot.makeApiCall('GET', '2/foo', { a: 0, b: 1 })
    ).resolves.toEqual({ data: { id: '11111' } });

    expect(apiCall.isDone()).toBe(true);
  });

  test('POST request', async () => {
    const bot = new TwitterBot(authOptions);
    bot.start();

    const apiCall = twitterApi
      .post('/2/foo', { a: 0, b: 1 })
      .reply(200, { data: { id: '11111' } });

    await expect(
      bot.makeApiCall('POST', '2/foo', { a: 0, b: 1 })
    ).resolves.toEqual({ data: { id: '11111' } });

    expect(apiCall.isDone()).toBe(true);
  });

  test('with asApplication option', async () => {
    const bot = new TwitterBot(authOptions);
    bot.start();

    const apiCall = twitterApi
      .post(
        '/2/foo',
        { a: 0, b: 1 },
        { reqheaders: { Authorization: 'Bearer __BEARER_TOKEN__' } }
      )
      .reply(200, { data: { id: '11111' } });

    await expect(
      bot.makeApiCall('POST', '2/foo', { a: 0, b: 1 }, { asApplication: true })
    ).resolves.toEqual({ data: { id: '11111' } });

    expect(apiCall.isDone()).toBe(true);
  });
});

describe('.renderMedia(media)', () => {
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

    const bot = new TwitterBot(authOptions);

    await expect(
      bot.renderMedia(
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
            Array [
              Object {
                "id": "222222222222222222",
                "result": Object {
                  "media_id": 222222222222222222n,
                  "media_id_string": "222222222222222222",
                },
                "source": Object {
                  "parameters": Object {
                    "additional_owners": undefined,
                    "media_category": undefined,
                    "shared": "true",
                  },
                  "type": "url",
                  "url": "https://sociably.io/img/foo.jpg",
                },
                "type": "photo",
              },
              Object {
                "id": "111111111111111111",
                "result": Object {
                  "media_id": 111111111111111111n,
                  "media_id_string": "111111111111111111",
                },
                "source": Object {
                  "assetTag": undefined,
                  "fileData": Object {
                    "data": Array [
                      102,
                      111,
                      111,
                    ],
                    "type": "Buffer",
                  },
                  "parameters": Object {
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
    const bot = new TwitterBot(authOptions);

    await expect(
      bot.renderMedia('foo')
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"\\"foo\\" is not media"`);
    await expect(
      bot.renderMedia(<Sociably.Pause />)
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"<Pause /> is not media"`);
    await expect(
      bot.renderMedia(<DirectMessage>foo</DirectMessage>)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"<DirectMessage /> is not media"`
    );
  });

  it('return null if the node is empty', async () => {
    const bot = new TwitterBot(authOptions);

    await expect(bot.renderMedia(<>{null}</>)).resolves.toBe(null);
  });
});

describe('.renderWelcomeMessage(name, message)', () => {
  test('create welcome message', async () => {
    const bot = new TwitterBot(authOptions);
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
      bot.renderWelcomeMessage(
        'foo_welcome',
        <DirectMessage>Foo!</DirectMessage>
      )
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "welcome_message": Object {
                "created_timestamp": "1470182274821",
                "id": "844385345234",
                "message_data": Object {
                  "text": "Foo!",
                },
                "name": "foo_welcome",
              },
            }
          `);

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    expect(bodySpy.mock).toHaveBeenCalledWith({
      welcome_message: {
        name: 'foo_welcome',
        message_data: { text: 'Foo!' },
      },
    });
    expect(createWelcomeCall.isDone()).toBe(true);
  });

  test('return null if content is empty', async () => {
    const bot = new TwitterBot(authOptions);
    bot.start();

    await expect(bot.renderWelcomeMessage('foo_welcome', null)).resolves.toBe(
      null
    );
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

  const bot = new TwitterBot(authOptions);

  const response = await bot.fetchMediaFile(
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

  expect(authSpy.mock).toHaveBeenCalledTimes(1);
  expect(
    authSpy.mock.calls[0].args[0]
      .replace(/oauth_nonce="[^"]+"/, 'oauth_nonce="_NONCE_"')
      .replace(/oauth_timestamp="\d+"/, 'oauth_timestamp="1234567890"')
      .replace(/oauth_signature="[^"]+"/, 'oauth_signature="_SIGNATURE_"')
  ).toMatchInlineSnapshot(
    `"OAuth oauth_consumer_key=\\"__APP_KEY__\\",oauth_nonce=\\"_NONCE_\\",oauth_signature_method=\\"HMAC-SHA1\\",oauth_timestamp=\\"1234567890\\",oauth_token=\\"1234567890-__ACCESS_TOKEN__\\",oauth_version=\\"1.0\\",oauth_signature=\\"_SIGNATURE_\\""`
  );

  expect(content).toEqual(mediaContent);
  expect(mediaFileApi.isDone()).toBe(true);
});
