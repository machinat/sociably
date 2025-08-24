import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget.js';
import { Tweet } from '../Tweet.js';
import { Photo } from '../Media.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<Tweet />)).toBe(true);
  expect(Tweet.$$platform).toBe('twitter');
  expect(Tweet.$$name).toBe('Tweet');
});

test("rendering to agent's page", async () => {
  const segments = await renderUnitElement(
    <Tweet quoteTweetId="67890" replySetting="following" superFollowersOnly>
      Hello World
    </Tweet>,
  );
  expect(segments).toMatchSnapshot();
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TweetTarget('12345'), request, null))
    .toMatchInlineSnapshot(`
    {
      "method": "POST",
      "params": {
        "direct_message_deep_link": undefined,
        "for_super_followers_only": true,
        "geo": undefined,
        "media": undefined,
        "poll": undefined,
        "quote_tweet_id": "67890",
        "reply": undefined,
        "reply_settings": "following",
        "text": "Hello World",
      },
      "url": "2/tweets",
    }
  `);
});

test('rendering as a reply', async () => {
  const segments = await renderUnitElement(
    <Tweet
      placeId="55555"
      poll={{ durationMinutes: 60, options: ['foo', 'bar', 'baz'] }}
      excludeUsersInReply={['56789']}
    >
      Hello World
    </Tweet>,
  );
  expect(segments).toMatchSnapshot();
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TweetTarget('12345', '67890'), request, null))
    .toMatchInlineSnapshot(`
    {
      "method": "POST",
      "params": {
        "direct_message_deep_link": undefined,
        "for_super_followers_only": undefined,
        "geo": {
          "place_id": "55555",
        },
        "media": undefined,
        "poll": {
          "duration_minutes": 60,
          "options": [
            "foo",
            "bar",
            "baz",
          ],
        },
        "quote_tweet_id": undefined,
        "reply": {
          "exclude_reply_user_ids": [
            "56789",
          ],
          "in_reply_to_tweet_id": "67890",
        },
        "reply_settings": undefined,
        "text": "Hello World",
      },
      "url": "2/tweets",
    }
  `);
});

test('rendering with media', async () => {
  const segments = await renderUnitElement(
    <Tweet
      superFollowersOnly
      tagUsersInMedia={['56789']}
      media={
        <>
          <Photo mediaId="123" />
          <Photo url="http://foo.bar/baz.png" />
          <Photo
            file={{
              data: Buffer.from('foo'),
              contentType: 'image/jpeg',
              contentLength: 123,
            }}
          />
        </>
      }
    />,
  );
  expect(segments).toMatchSnapshot();
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(
    accomplishRequest(new TweetTarget('12345'), request, [
      '12345',
      '23456',
      '34567',
    ]),
  ).toMatchInlineSnapshot(`
    {
      "method": "POST",
      "params": {
        "direct_message_deep_link": undefined,
        "for_super_followers_only": true,
        "geo": undefined,
        "media": {
          "media_ids": [
            "12345",
            "23456",
            "34567",
          ],
          "tagged_user_ids": [
            "56789",
          ],
        },
        "poll": undefined,
        "quote_tweet_id": undefined,
        "reply": undefined,
        "reply_settings": undefined,
        "text": undefined,
      },
      "url": "2/tweets",
    }
  `);
});

test("rendering to agent's page", async () => {
  let segments = await renderUnitElement(
    <Tweet directMessageLink>Hello World</Tweet>,
  );
  let { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TweetTarget('12345'), request, null))
    .toMatchInlineSnapshot(`
    {
      "method": "POST",
      "params": {
        "direct_message_deep_link": "https://twitter.com/messages/compose?recipient_id=12345",
        "for_super_followers_only": undefined,
        "geo": undefined,
        "media": undefined,
        "poll": undefined,
        "quote_tweet_id": undefined,
        "reply": undefined,
        "reply_settings": undefined,
        "text": "Hello World",
      },
      "url": "2/tweets",
    }
  `);

  segments = await renderUnitElement(
    <Tweet directMessageLink="https://twitter.com/messages/compose?recipient_id=23456&text=boo">
      Hello World
    </Tweet>,
  );
  ({ request, accomplishRequest } = (segments as any)[0].value);
  expect(accomplishRequest(new TweetTarget('12345'), request, null))
    .toMatchInlineSnapshot(`
    {
      "method": "POST",
      "params": {
        "direct_message_deep_link": "https://twitter.com/messages/compose?recipient_id=23456&text=boo",
        "for_super_followers_only": undefined,
        "geo": undefined,
        "media": undefined,
        "poll": undefined,
        "quote_tweet_id": undefined,
        "reply": undefined,
        "reply_settings": undefined,
        "text": "Hello World",
      },
      "url": "2/tweets",
    }
  `);

  segments = await renderUnitElement(
    <Tweet
      directMessageLink={{ text: 'hello world', welcomeMessageId: '22222' }}
    >
      Hello World
    </Tweet>,
  );
  ({ request, accomplishRequest } = (segments as any)[0].value);
  expect(accomplishRequest(new TweetTarget('12345'), request, null))
    .toMatchInlineSnapshot(`
    {
      "method": "POST",
      "params": {
        "direct_message_deep_link": "https://twitter.com/messages/compose?recipient_id=12345&welcome_message_id=22222&text=hello%20world",
        "for_super_followers_only": undefined,
        "geo": undefined,
        "media": undefined,
        "poll": undefined,
        "quote_tweet_id": undefined,
        "reply": undefined,
        "reply_settings": undefined,
        "text": "Hello World",
      },
      "url": "2/tweets",
    }
  `);
});

it('throw if multiple attchments received', async () => {
  await expect(
    renderUnitElement(
      <Tweet
        quoteTweetId="23456"
        poll={{ durationMinutes: 1, options: ['2', '3'] }}
      >
        Hello
      </Tweet>,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"there should be exactly one of "media", "poll" or "quoteTweetId" prop"`,
  );

  await expect(
    renderUnitElement(
      <Tweet media={<Photo mediaId="33333" />} quoteTweetId="23456" />,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"there should be exactly one of "media", "poll" or "quoteTweetId" prop"`,
  );
});

it('throw if non-textual content in children', async () => {
  await expect(
    renderUnitElement(
      <Tweet>
        <Photo mediaId="44444" />
      </Tweet>,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-texual element <Photo /> can't be placed under <Tweet/>"`,
  );

  await expect(
    renderUnitElement(
      <Tweet>
        <Sociably.Pause />
      </Tweet>,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-texual element <Pause /> can't be placed under <Tweet/>"`,
  );
});

it('throw if invalid media received', async () => {
  await expect(
    renderUnitElement(<Tweet media={'foo' as never} />),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""foo" can't be placed in "media" prop"`,
  );

  await expect(
    renderUnitElement(<Tweet media={<Sociably.Pause />} />),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<Pause /> can't be placed in "media" prop"`,
  );
});

it('throw if no content available', async () => {
  await expect(
    renderUnitElement(<Tweet />),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"no text or media in <Tweet/>"`,
  );
});

test('spliting long content into tweet thread', async () => {
  const segments = await renderUnitElement(
    <Tweet
      placeId="98765"
      quoteTweetId="67890"
      replySetting="following"
      superFollowersOnly
    >
      國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國
      國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國
      國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國
      國國國國國國國國國國國國國國國國國國國國國國囧國國國國國國國國國國國國國國國國國國國國國
      國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國
      國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國
      國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國
    </Tweet>,
  );
  expect(segments).toMatchSnapshot();
  expect(
    (segments as any).map(({ value: { request, accomplishRequest } }, i) =>
      accomplishRequest(
        i === 0
          ? new TweetTarget('12345')
          : new TweetTarget('12345', String(11111 * i)),
        request,
        null,
      ),
    ),
  ).toMatchInlineSnapshot(`
    [
      {
        "method": "POST",
        "params": {
          "direct_message_deep_link": undefined,
          "for_super_followers_only": true,
          "geo": {
            "place_id": "98765",
          },
          "media": undefined,
          "poll": undefined,
          "quote_tweet_id": "67890",
          "reply": undefined,
          "reply_settings": "following",
          "text": "國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國 國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國 國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國 國國國國國國",
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
            "in_reply_to_tweet_id": "11111",
          },
          "text": "國國國國國國國國國國國國國國國國囧國國國國國國國國國國國國國國國國國國國國國 國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國 國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國 國國國國國國國國國國國國",
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
            "in_reply_to_tweet_id": "22222",
          },
          "text": "國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國國",
        },
        "url": "2/tweets",
      },
    ]
  `);
});
