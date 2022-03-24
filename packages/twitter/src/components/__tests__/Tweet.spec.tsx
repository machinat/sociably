import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils';
import Renderer from '@machinat/core/renderer';
import TweetTarget from '../../TweetTarget';
import { Tweet } from '../Tweet';
import { Photo } from '../Media';

const renderer = new Renderer('twitter', async () => null);
const render = (element) => renderer.render(element, null, null);

it('is a valid Component', () => {
  expect(typeof Tweet).toBe('function');
  expect(isNativeType(<Tweet />)).toBe(true);
  expect(Tweet.$$platform).toBe('twitter');
});

test("rendering to agent's page", async () => {
  const segments = await render(
    <Tweet quoteTweetId="67890" replySetting="following" superFollowersOnly>
      Hello World
    </Tweet>
  );
  expect(segments).toMatchSnapshot();
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TweetTarget('12345'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "href": "2/tweets",
      "method": "POST",
      "parameters": Object {
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
    }
  `);
});

test('rendering as a reply', async () => {
  const segments = await render(
    <Tweet
      placeId="55555"
      poll={{ durationMinutes: 60, options: ['foo', 'bar', 'baz'] }}
      excludeUsersInReply={['56789']}
    >
      Hello World
    </Tweet>
  );
  expect(segments).toMatchSnapshot();
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TweetTarget('12345', '67890'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "href": "2/tweets",
      "method": "POST",
      "parameters": Object {
        "direct_message_deep_link": undefined,
        "for_super_followers_only": undefined,
        "geo": Object {
          "place_id": "55555",
        },
        "media": undefined,
        "poll": Object {
          "duration_minutes": 60,
          "options": Array [
            "foo",
            "bar",
            "baz",
          ],
        },
        "quote_tweet_id": undefined,
        "reply": Object {
          "exclude_reply_user_ids": Array [
            "56789",
          ],
          "in_reply_to_tweet_id": "67890",
        },
        "reply_settings": undefined,
        "text": "Hello World",
      },
    }
  `);
});

test('rendering with media', async () => {
  const segments = await render(
    <Tweet
      superFollowersOnly
      tagUsersInMedia={['56789']}
      media={
        <>
          <Photo mediaId="123" />
          <Photo url="http://foo.bar/baz.png" />
          <Photo
            file={Buffer.from('foo')}
            fileSize={123}
            fileType="image/jpeg"
          />
        </>
      }
    />
  );
  expect(segments).toMatchSnapshot();
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(
    accomplishRequest(new TweetTarget('12345'), request, [
      '12345',
      '23456',
      '34567',
    ])
  ).toMatchInlineSnapshot(`
    Object {
      "href": "2/tweets",
      "method": "POST",
      "parameters": Object {
        "direct_message_deep_link": undefined,
        "for_super_followers_only": true,
        "geo": undefined,
        "media": Object {
          "media_ids": Array [
            "12345",
            "23456",
            "34567",
          ],
          "tagged_user_ids": Array [
            "56789",
          ],
        },
        "poll": undefined,
        "quote_tweet_id": undefined,
        "reply": undefined,
        "reply_settings": undefined,
        "text": undefined,
      },
    }
  `);
});

test("rendering to agent's page", async () => {
  let segments = await render(<Tweet directMessageLink>Hello World</Tweet>);
  let { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TweetTarget('12345'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "href": "2/tweets",
      "method": "POST",
      "parameters": Object {
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
    }
  `);

  segments = await render(
    <Tweet directMessageLink="https://twitter.com/messages/compose?recipient_id=23456&text=boo">
      Hello World
    </Tweet>
  );
  ({ request, accomplishRequest } = (segments as any)[0].value);
  expect(accomplishRequest(new TweetTarget('12345'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "href": "2/tweets",
      "method": "POST",
      "parameters": Object {
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
    }
  `);

  segments = await render(
    <Tweet
      directMessageLink={{ text: 'hello world', welcomeMessageId: '22222' }}
    >
      Hello World
    </Tweet>
  );
  ({ request, accomplishRequest } = (segments as any)[0].value);
  expect(accomplishRequest(new TweetTarget('12345'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "href": "2/tweets",
      "method": "POST",
      "parameters": Object {
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
    }
  `);
});

it('throw if multiple attchments received', async () => {
  await expect(
    render(
      <Tweet
        quoteTweetId="23456"
        poll={{ durationMinutes: 1, options: ['2', '3'] }}
      >
        Hello
      </Tweet>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"there should be exactly one of \\"media\\", \\"poll\\" or \\"quoteTweetId\\" prop"`
  );

  await expect(
    render(<Tweet media={<Photo mediaId="33333" />} quoteTweetId="23456" />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"there should be exactly one of \\"media\\", \\"poll\\" or \\"quoteTweetId\\" prop"`
  );
});

it('throw if non-textual content in children', async () => {
  await expect(
    render(
      <Tweet>
        <Photo mediaId="44444" />
      </Tweet>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-texual element <Photo /> can't be placed under <Tweet/>"`
  );

  await expect(
    render(
      <Tweet>
        <Machinat.Pause />
      </Tweet>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"non-texual element <Pause /> can't be placed under <Tweet/>"`
  );
});

it('throw if invalid media received', async () => {
  await expect(
    render(<Tweet media={'foo' as never} />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"\\"foo\\" can't be placed in \\"media\\" prop"`
  );

  await expect(
    render(<Tweet media={<Machinat.Pause />} />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<Pause /> can't be placed in \\"media\\" prop"`
  );
});

it('throw if no content available', async () => {
  await expect(render(<Tweet />)).rejects.toThrowErrorMatchingInlineSnapshot(
    `"no text or media in <Tweet/>"`
  );
});
