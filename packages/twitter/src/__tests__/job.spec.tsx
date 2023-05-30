import Sociably from '@sociably/core';
import {
  createTweetJobs,
  createDirectMessageJobs,
  createWelcomeMessageJobs,
} from '../job.js';
import createTweetSegmentValue from '../utils/createTweetSegmentValue.js';
import createDmSegmentValue from '../utils/createDmSegmentValue.js';
import TweetTarget from '../TweetTarget.js';
import TwitterChat from '../Chat.js';

describe('createTweetJobs(options)(tweetTarget, segments)', () => {
  test('with text and media', () => {
    const target = new TweetTarget('12345');
    const jobs = createTweetJobs({ key: '123' })(target, [
      { type: 'text', node: <foo />, path: '$:1', value: 'Hello' },
      {
        type: 'unit',
        node: <foo />,
        path: '$:2',
        value: {
          type: 'media',
          attachment: { type: 'photo', source: { type: 'id', id: '11111' } },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:3',
        value: {
          type: 'media',
          attachment: { type: 'photo', source: { type: 'id', id: '22222' } },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:4',
        value: createTweetSegmentValue({ text: 'World' }),
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:5',
        value: {
          type: 'media',
          attachment: { type: 'video', source: { type: 'id', id: '33333' } },
        },
      },
      { type: 'text', node: <foo />, path: '$:6', value: 'Haro' },
      {
        type: 'unit',
        node: <foo />,
        path: '$:6',
        value: {
          type: 'action',
          request: { method: 'POST', href: '1.1/foo', params: {} },
          accomplishRequest: null,
          mediaSources: null,
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:8',
        value: {
          type: 'media',
          attachment: {
            type: 'animated_gif',
            source: { type: 'id', id: '44444' },
          },
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();
    expect(
      jobs.map(({ request, accomplishRequest }, i) =>
        accomplishRequest
          ? accomplishRequest(
              [
                target,
                new TweetTarget('12345', '45678'),
                new TweetTarget('12345', '56789'),
                new TweetTarget('12345', '67890'),
                null as never,
              ][i],
              request,
              [['11111', '22222'], null, ['33333'], ['44444'], null][i]
            )
          : request
      )
    ).toMatchInlineSnapshot(`
      [
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": {
              "media_ids": [
                "11111",
                "22222",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": undefined,
            "text": "Hello",
          },
          "url": "2/tweets",
        },
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": undefined,
            "reply": {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "45678",
            },
            "text": "World",
          },
          "url": "2/tweets",
        },
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": {
              "media_ids": [
                "33333",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "56789",
            },
            "text": undefined,
          },
          "url": "2/tweets",
        },
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": {
              "media_ids": [
                "44444",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "67890",
            },
            "text": "Haro",
          },
          "url": "2/tweets",
        },
        {
          "href": "1.1/foo",
          "method": "POST",
          "params": {},
        },
      ]
    `);
  });

  test('more continuous media that exceed the limit of a tweet', () => {
    const target = new TweetTarget('12345');
    const jobs = createTweetJobs({ key: '123' })(target, [
      { type: 'text', node: <foo />, path: '$:1', value: 'Hello' },
      {
        type: 'unit',
        node: <foo />,
        path: '$:2',
        value: {
          type: 'media',
          attachment: { type: 'video', source: { type: 'id', id: '11111' } },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:3',
        value: {
          type: 'media',
          attachment: {
            type: 'animated_gif',
            source: { type: 'id', id: '22222' },
          },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:4',
        value: {
          type: 'media',
          attachment: { type: 'photo', source: { type: 'id', id: '33333' } },
        },
      },
      { type: 'text', node: <foo />, path: '$:5', value: 'World' },
      {
        type: 'unit',
        node: <foo />,
        path: '$:6',
        value: {
          type: 'media',
          attachment: { type: 'photo', source: { type: 'id', id: '44444' } },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:7',
        value: {
          type: 'media',
          attachment: { type: 'photo', source: { type: 'id', id: '55555' } },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:8',
        value: {
          type: 'media',
          attachment: { type: 'photo', source: { type: 'id', id: '66666' } },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:9',
        value: {
          type: 'media',
          attachment: { type: 'photo', source: { type: 'id', id: '77777' } },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:10',
        value: {
          type: 'media',
          attachment: { type: 'photo', source: { type: 'id', id: '88888' } },
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();
    expect(
      jobs.map(({ request, accomplishRequest }, i) =>
        accomplishRequest
          ? accomplishRequest(
              [
                target,
                new TweetTarget('12345', '23456'),
                new TweetTarget('12345', '34567'),
                new TweetTarget('12345', '45678'),
                new TweetTarget('12345', '56789'),
              ][i],
              request,
              [
                ['11111'],
                ['22222'],
                ['33333'],
                ['44444', '55555', '66666', '77777'],
                ['88888'],
              ][i]
            )
          : request
      )
    ).toMatchInlineSnapshot(`
      [
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": {
              "media_ids": [
                "11111",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": undefined,
            "text": "Hello",
          },
          "url": "2/tweets",
        },
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": {
              "media_ids": [
                "22222",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "23456",
            },
            "text": undefined,
          },
          "url": "2/tweets",
        },
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": {
              "media_ids": [
                "33333",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "34567",
            },
            "text": undefined,
          },
          "url": "2/tweets",
        },
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": {
              "media_ids": [
                "44444",
                "55555",
                "66666",
                "77777",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "45678",
            },
            "text": "World",
          },
          "url": "2/tweets",
        },
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": {
              "media_ids": [
                "88888",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "56789",
            },
            "text": undefined,
          },
          "url": "2/tweets",
        },
      ]
    `);
  });

  test('with text longer than the limit tweet', () => {
    const target = new TweetTarget('12345', '56789');
    const jobs = createTweetJobs({ key: '123' })(target, [
      {
        type: 'text',
        node: <foo />,
        path: '$:1',
        value: Array(71).fill('龍龜').join(''),
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:2',
        value: {
          type: 'media',
          attachment: { type: 'photo', source: { type: 'id', id: '11111' } },
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();
    expect(
      jobs.map(({ request, accomplishRequest }, i) =>
        accomplishRequest
          ? accomplishRequest(
              [target, new TweetTarget('12345', '23456')][i],
              request,
              [null, ['11111']][i]
            )
          : request
      )
    ).toMatchInlineSnapshot(`
      [
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": undefined,
            "reply": {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "56789",
            },
            "text": "龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜",
          },
          "url": "2/tweets",
        },
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": {
              "media_ids": [
                "11111",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "23456",
            },
            "text": "龍龜",
          },
          "url": "2/tweets",
        },
      ]
    `);
  });

  test('with media, poll and quote tweet', () => {
    const target = new TweetTarget('12345');
    const jobs = createTweetJobs({ key: '123' })(target, [
      {
        type: 'unit',
        node: <foo />,
        path: '$:1',
        value: createTweetSegmentValue({
          text: 'Yo',
          poll: { duration: 60, options: ['foo', 'bar'] },
        }),
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:2',
        value: {
          type: 'media',
          attachment: { type: 'video', source: { type: 'id', id: '11111' } },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:3',
        value: createTweetSegmentValue({
          text: 'Hi',
          quote_tweet_id: '98765',
        }),
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:4',
        value: {
          type: 'media',
          attachment: {
            type: 'animated_gif',
            source: { type: 'id', id: '22222' },
          },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:5',
        value: createTweetSegmentValue({ text: 'Howdy' }, [
          { type: 'video', source: { type: 'id', id: '33333' } },
        ]),
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:6',
        value: {
          type: 'media',
          attachment: { type: 'photo', source: { type: 'id', id: '44444' } },
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();
    expect(
      jobs.map(({ request, accomplishRequest }, i) =>
        accomplishRequest
          ? accomplishRequest(
              [
                target,
                new TweetTarget('12345', '23456'),
                new TweetTarget('12345', '34567'),
                new TweetTarget('12345', '45678'),
                new TweetTarget('12345', '56789'),
                new TweetTarget('12345', '67890'),
              ][i],
              request,
              [null, ['11111'], null, ['22222'], ['33333'], ['44444']][i]
            )
          : request
      )
    ).toMatchInlineSnapshot(`
      [
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": undefined,
            "poll": {
              "duration": 60,
              "options": [
                "foo",
                "bar",
              ],
            },
            "reply": undefined,
            "text": "Yo",
          },
          "url": "2/tweets",
        },
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": {
              "media_ids": [
                "11111",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "23456",
            },
            "text": undefined,
          },
          "url": "2/tweets",
        },
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": undefined,
            "quote_tweet_id": "98765",
            "reply": {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "34567",
            },
            "text": "Hi",
          },
          "url": "2/tweets",
        },
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": {
              "media_ids": [
                "22222",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "45678",
            },
            "text": undefined,
          },
          "url": "2/tweets",
        },
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": {
              "media_ids": [
                "33333",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "56789",
            },
            "text": "Howdy",
          },
          "url": "2/tweets",
        },
        {
          "method": "POST",
          "params": {
            "direct_message_deep_link": undefined,
            "media": {
              "media_ids": [
                "44444",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "67890",
            },
            "text": undefined,
          },
          "url": "2/tweets",
        },
      ]
    `);
  });

  test('throw if dm features received', () => {
    expect(() =>
      createTweetJobs({ key: '123' })(new TweetTarget('12345'), [
        { type: 'text', node: <foo />, path: '$:1', value: 'Hello' },
        {
          type: 'unit',
          node: <foo />,
          path: '$:2',
          value: {
            type: 'dm',
            request: {
              method: 'POST',
              href: '1.1/direct_messages/foo',
              params: {},
            },
            mediaSources: null,
            accomplishRequest: null,
          },
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"direct message feature <foo /> cannot be used while tweeting"`
    );
  });
});

describe('createDmSegmentValue(chat, segment)', () => {
  test('jobs from all kinds og segment', () => {
    const chat = new TwitterChat('12345', '67890');
    const jobs = createDirectMessageJobs(chat, [
      { type: 'text', node: <foo />, path: '$:1', value: 'Hello' },
      {
        type: 'unit',
        node: <foo />,
        path: '$:2',
        value: {
          type: 'media',
          attachment: { type: 'photo', source: { type: 'id', id: '11111' } },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:3',
        value: createDmSegmentValue('World', {
          type: 'video',
          source: { type: 'id', id: '22222' },
        }),
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:4',
        value: {
          type: 'action',
          request: { method: 'POST', href: '1.1/foo', params: {} },
          accomplishRequest: null,
          mediaSources: null,
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();
    expect(
      jobs.map(({ request, accomplishRequest }, i) =>
        accomplishRequest
          ? accomplishRequest(
              chat,
              request,
              i === 1 ? ['11111'] : i === 2 ? ['22222'] : null
            )
          : request
      )
    ).toMatchInlineSnapshot(`
      [
        {
          "method": "POST",
          "params": {
            "event": {
              "message_create": {
                "message_data": {
                  "attachment": undefined,
                  "text": "Hello",
                },
                "target": {
                  "recipient_id": "67890",
                },
              },
              "type": "message_create",
            },
          },
          "url": "1.1/direct_messages/events/new.json",
        },
        {
          "method": "POST",
          "params": {
            "event": {
              "message_create": {
                "message_data": {
                  "attachment": {
                    "media": {
                      "id": "11111",
                    },
                    "type": "media",
                  },
                  "text": undefined,
                },
                "target": {
                  "recipient_id": "67890",
                },
              },
              "type": "message_create",
            },
          },
          "url": "1.1/direct_messages/events/new.json",
        },
        {
          "method": "POST",
          "params": {
            "event": {
              "message_create": {
                "message_data": {
                  "attachment": {
                    "media": {
                      "id": "22222",
                    },
                    "type": "media",
                  },
                  "text": "World",
                },
                "target": {
                  "recipient_id": "67890",
                },
              },
              "type": "message_create",
            },
          },
          "url": "1.1/direct_messages/events/new.json",
        },
        {
          "href": "1.1/foo",
          "method": "POST",
          "params": {},
        },
      ]
    `);
  });

  test('throw if tweet features received', () => {
    expect(() =>
      createDirectMessageJobs(new TwitterChat('12345', '67890'), [
        { type: 'text', node: <foo />, path: '$:1', value: 'Hello' },
        {
          type: 'unit',
          node: <foo />,
          path: '$:2',
          value: {
            type: 'tweet',
            request: {
              method: 'POST',
              href: '2/tweet',
              params: {},
            },
            mediaSources: null,
            accomplishRequest: null,
          },
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"tweeting feature <foo /> cannot be used while tweeting"`
    );
  });
});

describe('createWelcomeMessageJobs', () => {
  test('with text segment', async () => {
    const jobs = createWelcomeMessageJobs('foo')(
      new TweetTarget('1234567890'),
      [{ type: 'text', node: 'Foo!', value: 'Foo!', path: '$' }]
    );
    expect(jobs).toMatchSnapshot();

    const [job] = jobs;
    expect(job.accomplishRequest!(job.target!, job.request, null))
      .toMatchInlineSnapshot(`
      {
        "method": "POST",
        "params": {
          "welcome_message": {
            "message_data": {
              "attachment": undefined,
              "text": "Foo!",
            },
            "name": "foo",
          },
        },
        "url": "1.1/direct_messages/welcome_messages/new.json",
      }
    `);
  });

  test('with media segment', async () => {
    const jobs = createWelcomeMessageJobs('foo')(
      new TweetTarget('1234567890'),
      [
        {
          type: 'unit',
          node: <img src="http://..." />,
          value: {
            type: 'media',
            attachment: {
              type: 'photo',
              source: { type: 'url', url: 'http://...', params: {} },
            },
          },
          path: '$',
        },
      ]
    );
    expect(jobs).toMatchSnapshot();

    const [job] = jobs;
    expect(job.accomplishRequest!(job.target!, job.request, ['1234567890']))
      .toMatchInlineSnapshot(`
      {
        "method": "POST",
        "params": {
          "welcome_message": {
            "message_data": {
              "attachment": {
                "media": {
                  "id": "1234567890",
                },
                "type": "media",
              },
              "text": undefined,
            },
            "name": "foo",
          },
        },
        "url": "1.1/direct_messages/welcome_messages/new.json",
      }
    `);
  });

  test('with dm segment', async () => {
    const jobs = createWelcomeMessageJobs('foo')(
      new TweetTarget('1234567890'),
      [
        {
          type: 'unit',
          node: <p />,
          value: createDmSegmentValue('Foo!', {
            type: 'photo',
            source: { type: 'id', id: '1234567890' },
          }),
          path: '$',
        },
      ]
    );
    expect(jobs).toMatchSnapshot();

    const [job] = jobs;
    expect(job.accomplishRequest!(job.target!, job.request, ['1234567890']))
      .toMatchInlineSnapshot(`
      {
        "method": "POST",
        "params": {
          "welcome_message": {
            "message_data": {
              "attachment": {
                "media": {
                  "id": "1234567890",
                },
                "type": "media",
              },
              "text": "Foo!",
            },
            "name": "foo",
          },
        },
        "url": "1.1/direct_messages/welcome_messages/new.json",
      }
    `);
  });

  test('throw if invalid message received', () => {
    expect(() =>
      createWelcomeMessageJobs('foo')(new TweetTarget('1234567890'), [
        {
          type: 'unit',
          node: <foo />,
          value: {
            type: 'tweet',
            request: {
              method: 'POST',
              href: '2/tweets',
              params: { text: 'Foo!' },
            },
            mediaSources: null,
            accomplishRequest: null,
          },
          path: '$',
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"<foo /> cannot be used as welcome message"`
    );

    expect(() =>
      createWelcomeMessageJobs('foo')(new TweetTarget('1234567890'), [
        {
          type: 'unit',
          node: <foo />,
          value: {
            type: 'action',
            request: {
              method: 'POST',
              href: '2/foo',
              params: { bar: 'baz' },
            },
            mediaSources: null,
            accomplishRequest: null,
          },
          path: '$',
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"<foo /> cannot be used as welcome message"`
    );
  });

  test('throw if multiple messages received', () => {
    expect(() =>
      createWelcomeMessageJobs('foo')(new TweetTarget('1234567890'), [
        { type: 'text', node: 'Bar!', value: 'Bar!', path: '$:1' },
        { type: 'text', node: 'Baz!', value: 'Baz!', path: '$:1' },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"welcome message should contain only one direct message"`
    );

    const creator = createWelcomeMessageJobs('foo');
    creator(new TweetTarget('1234567890'), [
      { type: 'text', node: 'Bar!', value: 'Bar!', path: '$:0' },
    ]);

    expect(() =>
      creator(new TweetTarget('1234567890'), [
        { type: 'text', node: 'Baz!', value: 'Baz!', path: '$:2' },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"welcome message should contain only one direct message"`
    );
  });
});
