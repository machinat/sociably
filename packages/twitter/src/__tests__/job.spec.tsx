import Machinat from '@machinat/core';
import { createTweetJobs, createDirectMessageJobs } from '../job';
import createTweetSegmentValue from '../utils/createTweetSegmentValue';
import createDmSegmentValue from '../utils/createDmSegmentValue';
import TweetTarget from '../TweetTarget';
import TwitterChat from '../Chat';

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
          media: { type: 'photo', sourceType: 'id', id: '11111' },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:3',
        value: {
          type: 'media',
          media: { type: 'photo', sourceType: 'id', id: '22222' },
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
          media: { type: 'video', sourceType: 'id', id: '33333' },
        },
      },
      { type: 'text', node: <foo />, path: '$:6', value: 'Haro' },
      {
        type: 'unit',
        node: <foo />,
        path: '$:6',
        value: {
          type: 'action',
          request: { method: 'POST', href: '1.1/foo', parameters: null },
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
          media: { type: 'animated_gif', sourceType: 'id', id: '44444' },
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
      Array [
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": Object {
              "media_ids": Array [
                "11111",
                "22222",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": undefined,
            "text": "Hello",
          },
        },
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": undefined,
            "reply": Object {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "45678",
            },
            "text": "World",
          },
        },
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": Object {
              "media_ids": Array [
                "33333",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": Object {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "56789",
            },
            "text": undefined,
          },
        },
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": Object {
              "media_ids": Array [
                "44444",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": Object {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "67890",
            },
            "text": "Haro",
          },
        },
        Object {
          "href": "1.1/foo",
          "method": "POST",
          "parameters": null,
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
          media: { type: 'video', sourceType: 'id', id: '11111' },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:3',
        value: {
          type: 'media',
          media: { type: 'animated_gif', sourceType: 'id', id: '22222' },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:4',
        value: {
          type: 'media',
          media: { type: 'photo', sourceType: 'id', id: '33333' },
        },
      },
      { type: 'text', node: <foo />, path: '$:5', value: 'World' },
      {
        type: 'unit',
        node: <foo />,
        path: '$:6',
        value: {
          type: 'media',
          media: { type: 'photo', sourceType: 'id', id: '44444' },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:7',
        value: {
          type: 'media',
          media: { type: 'photo', sourceType: 'id', id: '55555' },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:8',
        value: {
          type: 'media',
          media: { type: 'photo', sourceType: 'id', id: '66666' },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:9',
        value: {
          type: 'media',
          media: { type: 'photo', sourceType: 'id', id: '77777' },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:10',
        value: {
          type: 'media',
          media: { type: 'photo', sourceType: 'id', id: '88888' },
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
      Array [
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": Object {
              "media_ids": Array [
                "11111",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": undefined,
            "text": "Hello",
          },
        },
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": Object {
              "media_ids": Array [
                "22222",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": Object {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "23456",
            },
            "text": undefined,
          },
        },
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": Object {
              "media_ids": Array [
                "33333",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": Object {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "34567",
            },
            "text": undefined,
          },
        },
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": Object {
              "media_ids": Array [
                "44444",
                "55555",
                "66666",
                "77777",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": Object {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "45678",
            },
            "text": "World",
          },
        },
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": Object {
              "media_ids": Array [
                "88888",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": Object {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "56789",
            },
            "text": undefined,
          },
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
          media: { type: 'photo', sourceType: 'id', id: '11111' },
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
      Array [
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": undefined,
            "reply": Object {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "56789",
            },
            "text": "龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜龍龜",
          },
        },
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": Object {
              "media_ids": Array [
                "11111",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": Object {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "23456",
            },
            "text": "龍龜",
          },
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
          media: { type: 'video', sourceType: 'id', id: '11111' },
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
          media: { type: 'animated_gif', sourceType: 'id', id: '22222' },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:5',
        value: createTweetSegmentValue({ text: 'Howdy' }, [
          { type: 'video', sourceType: 'id', id: '33333' },
        ]),
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:6',
        value: {
          type: 'media',
          media: { type: 'photo', sourceType: 'id', id: '44444' },
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
      Array [
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": undefined,
            "poll": Object {
              "duration": 60,
              "options": Array [
                "foo",
                "bar",
              ],
            },
            "reply": undefined,
            "text": "Yo",
          },
        },
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": Object {
              "media_ids": Array [
                "11111",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": Object {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "23456",
            },
            "text": undefined,
          },
        },
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": undefined,
            "quote_tweet_id": "98765",
            "reply": Object {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "34567",
            },
            "text": "Hi",
          },
        },
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": Object {
              "media_ids": Array [
                "22222",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": Object {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "45678",
            },
            "text": undefined,
          },
        },
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": Object {
              "media_ids": Array [
                "33333",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": Object {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "56789",
            },
            "text": "Howdy",
          },
        },
        Object {
          "href": "2/tweets",
          "method": "POST",
          "parameters": Object {
            "direct_message_deep_link": undefined,
            "media": Object {
              "media_ids": Array [
                "44444",
              ],
              "tagged_user_ids": undefined,
            },
            "reply": Object {
              "exclude_reply_user_ids": undefined,
              "in_reply_to_tweet_id": "67890",
            },
            "text": undefined,
          },
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
              parameters: {},
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
          media: { type: 'photo', sourceType: 'id', id: '11111' },
        },
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:3',
        value: createDmSegmentValue('World', {
          type: 'video',
          sourceType: 'id',
          id: '22222',
        }),
      },
      {
        type: 'unit',
        node: <foo />,
        path: '$:4',
        value: {
          type: 'action',
          request: { method: 'POST', href: '1.1/foo', parameters: null },
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
      Array [
        Object {
          "href": "1.1/direct_messages/events/new.json",
          "method": "POST",
          "parameters": Object {
            "event": Object {
              "message_create": Object {
                "message_data": Object {
                  "attachment": undefined,
                  "text": "Hello",
                },
                "target": Object {
                  "recipient_id": "67890",
                },
              },
              "type": "message_create",
            },
          },
        },
        Object {
          "href": "1.1/direct_messages/events/new.json",
          "method": "POST",
          "parameters": Object {
            "event": Object {
              "message_create": Object {
                "message_data": Object {
                  "attachment": Object {
                    "media": Object {
                      "id": "11111",
                    },
                    "type": "media",
                  },
                  "text": undefined,
                },
                "target": Object {
                  "recipient_id": "67890",
                },
              },
              "type": "message_create",
            },
          },
        },
        Object {
          "href": "1.1/direct_messages/events/new.json",
          "method": "POST",
          "parameters": Object {
            "event": Object {
              "message_create": Object {
                "message_data": Object {
                  "attachment": Object {
                    "media": Object {
                      "id": "22222",
                    },
                    "type": "media",
                  },
                  "text": "World",
                },
                "target": Object {
                  "recipient_id": "67890",
                },
              },
              "type": "message_create",
            },
          },
        },
        Object {
          "href": "1.1/foo",
          "method": "POST",
          "parameters": null,
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
              parameters: {},
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