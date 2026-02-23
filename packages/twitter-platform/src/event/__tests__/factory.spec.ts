import eventFactory from '../factory.js';
import * as Events from '../events.js';
import type { RawTwitterEventBody } from '../../types.js';

const mockUser = {
  id: 1234567890,
  id_str: '1234567890',
  name: 'Test User',
  screen_name: 'testuser',
  protected: false,
  verified: false,
  followers_count: 100,
  friends_count: 50,
  listed_count: 0,
  favourites_count: 25,
  statuses_count: 200,
  created_at: 'Wed Oct 05 16:37:30 +0000 2011',
  profile_image_url: 'https://example.com/profile.jpg',
  profile_image_url_https: 'https://example.com/profile.jpg',
  profile_banner_url: 'https://example.com/banner.jpg',
  default_profile: false,
  default_profile_image: false,
};

const mockTweet = {
  id: 123456789,
  id_str: '123456789',
  text: 'This is a test tweet',
  created_at: 'Mon Sep 24 03:35:21 +0000 2012',
  source: '<a href="http://example.com" rel="nofollow">Test App</a>',
  truncated: false,
  user: mockUser,
  retweet_count: 0,
  favorite_count: 0,
  reply_count: 0,
  favorited: false,
  retweeted: false,
  is_quote_status: false,
  quoted_status_id: 0,
  quoted_status_id_str: '0',
  quoted_status: undefined,
  retweeted_status: undefined,
  filter_level: 'none' as const,
  entities: {
    hashtags: [],
    urls: [],
    user_mentions: [],
    media: [],
    symbols: [],
  },
  extended_entities: {
    media: [],
  },
};

const FOR_USER_ID = '1234567890';

describe('eventFactory', () => {
  it('ReplyTweetEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      tweet_create_events: [
        {
          ...mockTweet,
          in_reply_to_status_id: 123456780,
          in_reply_to_status_id_str: '123456780',
          in_reply_to_user_id_str: FOR_USER_ID,
          user: { ...mockUser, id_str: '9876543210' },
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.ReplyTweetEvent);
    expect(events[0].kind).toBe('tweet');
    expect(events[0].type).toBe('reply');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('QuotedTweetEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      tweet_create_events: [
        {
          ...mockTweet,
          quoted_status: {
            ...mockTweet,
            user: { ...mockUser, id_str: FOR_USER_ID },
          },
          user: { ...mockUser, id_str: '9876543210' },
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.QuotedTweetEvent);
    expect(events[0].kind).toBe('tweet');
    expect(events[0].type).toBe('quote_tweet');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('RetweetEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      tweet_create_events: [
        {
          ...mockTweet,
          retweeted_status: {
            ...mockTweet,
            user: { ...mockUser, id_str: FOR_USER_ID },
          },
          user: { ...mockUser, id_str: '9876543210' },
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.RetweetEvent);
    expect(events[0].kind).toBe('tweet');
    expect(events[0].type).toBe('retweet');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('MentionedTweetEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      tweet_create_events: [
        {
          ...mockTweet,
          user: { ...mockUser, id_str: '9876543210' },
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.MentionedTweetEvent);
    expect(events[0].kind).toBe('tweet');
    expect(events[0].type).toBe('mention');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('EchoTweetEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      tweet_create_events: [
        {
          ...mockTweet,
          user: { ...mockUser, id_str: FOR_USER_ID },
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.EchoTweetEvent);
    expect(events[0].kind).toBe('echo');
    expect(events[0].type).toBe('tweet');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('TextMessageEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      direct_message_events: [
        {
          type: 'message_create',
          id: '123456789012345678',
          created_timestamp: '1234567890000',
          message_create: {
            target: { recipient_id: FOR_USER_ID },
            sender_id: '9876543210',
            source_app_id: '123456',
            message_data: {
              text: 'Hello world',
              entities: {
                hashtags: [],
                symbols: [],
                user_mentions: [],
                urls: [],
                media: [],
              },
            },
          },
        },
      ],
      users: {},
      apps: {},
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.TextMessageEvent);
    expect(events[0].kind).toBe('message');
    expect(events[0].type).toBe('text');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('ImageMessageEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      direct_message_events: [
        {
          type: 'message_create',
          id: '123456789012345678',
          created_timestamp: '1234567890000',
          message_create: {
            target: { recipient_id: FOR_USER_ID },
            sender_id: '9876543210',
            source_app_id: '123456',
            message_data: {
              text: 'Check out this image',
              entities: {
                hashtags: [],
                symbols: [],
                user_mentions: [],
                urls: [],
                media: [],
              },
              attachment: {
                type: 'media',
                media: {
                  type: 'photo',
                  id: 123456789,
                  id_str: '123456789',
                  indices: [0, 23],
                  media_url: 'https://example.com/image.jpg',
                  media_url_https: 'https://example.com/image.jpg',
                  url: 'https://t.co/abc123',
                  display_url: 'pic.twitter.com/abc123',
                  expanded_url: 'https://twitter.com/user/status/123/photo/1',
                  sizes: {
                    medium: { w: 600, h: 338, resize: 'fit' },
                    thumb: { w: 150, h: 150, resize: 'crop' },
                    small: { w: 340, h: 191, resize: 'fit' },
                    large: { w: 1024, h: 576, resize: 'fit' },
                  },
                },
              },
            },
          },
        },
      ],
      users: {},
      apps: {},
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.ImageMessageEvent);
    expect(events[0].kind).toBe('message');
    expect(events[0].type).toBe('image');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('VideoMessageEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      direct_message_events: [
        {
          type: 'message_create',
          id: '123456789012345678',
          created_timestamp: '1234567890000',
          message_create: {
            target: { recipient_id: FOR_USER_ID },
            sender_id: '9876543210',
            source_app_id: '123456',
            message_data: {
              text: 'Check out this video',
              entities: {
                hashtags: [],
                symbols: [],
                user_mentions: [],
                urls: [],
                media: [],
              },
              attachment: {
                type: 'media',
                media: {
                  type: 'video',
                  id: 123456790,
                  id_str: '123456790',
                  indices: [0, 23],
                  media_url: 'https://example.com/video.mp4',
                  media_url_https: 'https://example.com/video.mp4',
                  url: 'https://t.co/abc123',
                  display_url: 'pic.twitter.com/abc123',
                  expanded_url: 'https://twitter.com/user/status/123/video/1',
                  sizes: {
                    medium: { w: 600, h: 338, resize: 'fit' },
                    thumb: { w: 150, h: 150, resize: 'crop' },
                    small: { w: 340, h: 191, resize: 'fit' },
                    large: { w: 1024, h: 576, resize: 'fit' },
                  },
                  video_info: {
                    aspect_ratio: [16, 9],
                    duration_millis: 30000,
                    variants: [
                      {
                        bitrate: 832000,
                        content_type: 'video/mp4',
                        url: 'https://example.com/video.mp4',
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      ],
      users: {},
      apps: {},
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.VideoMessageEvent);
    expect(events[0].kind).toBe('message');
    expect(events[0].type).toBe('video');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('AnimatedGifMessageEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      direct_message_events: [
        {
          type: 'message_create',
          id: '123456789012345678',
          created_timestamp: '1234567890000',
          message_create: {
            target: { recipient_id: FOR_USER_ID },
            sender_id: '9876543210',
            source_app_id: '123456',
            message_data: {
              text: 'Check out this GIF',
              entities: {
                hashtags: [],
                symbols: [],
                user_mentions: [],
                urls: [],
                media: [],
              },
              attachment: {
                type: 'media',
                media: {
                  type: 'animated_gif',
                  id: 123456791,
                  id_str: '123456791',
                  indices: [0, 20],
                  media_url: 'https://example.com/gif.gif',
                  media_url_https: 'https://example.com/gif.gif',
                  url: 'https://t.co/abc123',
                  display_url: 'pic.twitter.com/abc123',
                  expanded_url: 'https://twitter.com/user/status/123/photo/1',
                  sizes: {
                    medium: { w: 600, h: 338, resize: 'fit' },
                    thumb: { w: 150, h: 150, resize: 'crop' },
                    small: { w: 340, h: 191, resize: 'fit' },
                    large: { w: 1024, h: 576, resize: 'fit' },
                  },
                  video_info: {
                    aspect_ratio: [1, 1],
                    duration_millis: 5000,
                    variants: [
                      {
                        bitrate: 0,
                        content_type: 'video/mp4',
                        url: 'https://example.com/gif.mp4',
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      ],
      users: {},
      apps: {},
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.AnimatedGifMessageEvent);
    expect(events[0].kind).toBe('message');
    expect(events[0].type).toBe('animated_gif');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('QuickReplyEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      direct_message_events: [
        {
          type: 'message_create',
          id: '123456789012345678',
          created_timestamp: '1234567890000',
          message_create: {
            target: { recipient_id: FOR_USER_ID },
            sender_id: '9876543210',
            source_app_id: '123456',
            message_data: {
              text: 'Quick reply response',
              entities: {
                hashtags: [],
                symbols: [],
                user_mentions: [],
                urls: [],
                media: [],
              },
              quick_reply_response: {
                type: 'options',
                metadata: 'callback_data_123',
              },
            },
          },
        },
      ],
      users: {},
      apps: {},
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.QuickReplyEvent);
    expect(events[0].kind).toBe('callback');
    expect(events[0].type).toBe('quick_reply');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('EchoMessageEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      direct_message_events: [
        {
          type: 'message_create',
          id: '123456789012345678',
          created_timestamp: '1234567890000',
          message_create: {
            target: { recipient_id: '9876543210' },
            sender_id: FOR_USER_ID,
            source_app_id: '123456',
            message_data: {
              text: 'Hello world',
              entities: {
                hashtags: [],
                symbols: [],
                user_mentions: [],
                urls: [],
                media: [],
              },
            },
          },
        },
      ],
      users: {},
      apps: {},
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.EchoMessageEvent);
    expect(events[0].kind).toBe('echo');
    expect(events[0].type).toBe('message');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('LikeEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      favorite_events: [
        {
          id: '123456789012345678',
          created_at: 'Mon Sep 24 03:35:21 +0000 2012',
          timestamp_ms: 1234567890000,
          user: { ...mockUser, id_str: '9876543210' },
          favorited_status: mockTweet,
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.LikeEvent);
    expect(events[0].kind).toBe('action');
    expect(events[0].type).toBe('like');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('EchoLikeEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      favorite_events: [
        {
          id: '123456789012345678',
          created_at: 'Mon Sep 24 03:35:21 +0000 2012',
          timestamp_ms: 1234567890000,
          user: { ...mockUser, id_str: FOR_USER_ID },
          favorited_status: mockTweet,
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.EchoLikeEvent);
    expect(events[0].kind).toBe('echo');
    expect(events[0].type).toBe('like');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('FollowEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      follow_events: [
        {
          type: 'follow',
          created_timestamp: 1234567890000,
          source: { ...mockUser, id_str: '9876543210' },
          target: { ...mockUser, id_str: FOR_USER_ID },
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.FollowEvent);
    expect(events[0].kind).toBe('action');
    expect(events[0].type).toBe('follow');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('EchoFollowEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      follow_events: [
        {
          type: 'follow',
          created_timestamp: 1234567890000,
          source: { ...mockUser, id_str: FOR_USER_ID },
          target: { ...mockUser, id_str: '9876543210' },
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.EchoFollowEvent);
    expect(events[0].kind).toBe('echo');
    expect(events[0].type).toBe('follow');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('EchoUnfollowEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      follow_events: [
        {
          type: 'unfollow',
          created_timestamp: 1234567890000,
          source: { ...mockUser, id_str: FOR_USER_ID },
          target: { ...mockUser, id_str: '9876543210' },
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.EchoUnfollowEvent);
    expect(events[0].kind).toBe('echo');
    expect(events[0].type).toBe('unfollow');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('EchoBlockEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      block_events: [
        {
          type: 'block',
          created_timestamp: 1234567890000,
          source: { ...mockUser, id_str: FOR_USER_ID },
          target: { ...mockUser, id_str: '9876543210' },
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.EchoBlockEvent);
    expect(events[0].kind).toBe('echo');
    expect(events[0].type).toBe('block');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('EchoUnblockEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      block_events: [
        {
          type: 'unblock',
          created_timestamp: 1234567890000,
          source: { ...mockUser, id_str: FOR_USER_ID },
          target: { ...mockUser, id_str: '9876543210' },
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.EchoUnblockEvent);
    expect(events[0].kind).toBe('echo');
    expect(events[0].type).toBe('unblock');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('EchoMuteEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      mute_events: [
        {
          type: 'mute',
          created_timestamp: 1234567890000,
          source: { ...mockUser, id_str: FOR_USER_ID },
          target: { ...mockUser, id_str: '9876543210' },
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.EchoMuteEvent);
    expect(events[0].kind).toBe('echo');
    expect(events[0].type).toBe('mute');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('EchoUnmuteEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      mute_events: [
        {
          type: 'unmute',
          created_timestamp: 1234567890000,
          source: { ...mockUser, id_str: FOR_USER_ID },
          target: { ...mockUser, id_str: '9876543210' },
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.EchoUnmuteEvent);
    expect(events[0].kind).toBe('echo');
    expect(events[0].type).toBe('unmute');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('DirectMessageTypingEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      direct_message_indicate_typing_events: [
        {
          created_timestamp: '1234567890000',
          sender_id: '9876543210',
          target: { recipient_id: FOR_USER_ID },
          users: {},
        },
      ],
      users: {},
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.DirectMessageTypingEvent);
    expect(events[0].kind).toBe('action');
    expect(events[0].type).toBe('dm_typing');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('EchoDirectMessageTypingEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      direct_message_indicate_typing_events: [
        {
          created_timestamp: '1234567890000',
          sender_id: FOR_USER_ID,
          target: { recipient_id: '9876543210' },
          users: {},
        },
      ],
      users: {},
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.EchoDirectMessageTypingEvent);
    expect(events[0].kind).toBe('echo');
    expect(events[0].type).toBe('dm_typing');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('DirectMessageMarkReadEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      direct_message_mark_read_events: [
        {
          created_timestamp: '1234567890000',
          sender_id: '9876543210',
          target: { recipient_id: FOR_USER_ID },
          last_read_event_id: '123456789012345678',
          users: {},
        },
      ],
      users: {},
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.DirectMessageMarkReadEvent);
    expect(events[0].kind).toBe('action');
    expect(events[0].type).toBe('dm_mark_read');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('EchoDirectMessageMarkReadEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      direct_message_mark_read_events: [
        {
          created_timestamp: '1234567890000',
          sender_id: FOR_USER_ID,
          target: { recipient_id: '9876543210' },
          last_read_event_id: '123456789012345678',
          users: {},
        },
      ],
      users: {},
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.EchoDirectMessageMarkReadEvent);
    expect(events[0].kind).toBe('echo');
    expect(events[0].type).toBe('dm_mark_read');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('EchoDeleteTweetEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: FOR_USER_ID,
      tweet_delete_events: [
        {
          status: {
            id: '123456789012345678',
            user_id: FOR_USER_ID,
          },
          timestamp_ms: '1234567890000',
        },
      ],
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.EchoDeleteTweetEvent);
    expect(events[0].kind).toBe('echo');
    expect(events[0].type).toBe('delete_tweet');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });

  it('UserRevokeEvent', () => {
    const payload: RawTwitterEventBody = {
      for_user_id: '',
      user_event: {
        revoke: {
          date_time: 1672531200000,
          target: {
            app_id: '123456',
          },
          source: {
            user_id: FOR_USER_ID,
          },
        },
      },
    };

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.UserRevokeEvent);
    expect(events[0].kind).toBe('system');
    expect(events[0].type).toBe('user_revoke');
  });

  it('UnknownEvent', () => {
    const payload = {
      for_user_id: FOR_USER_ID,
      unknown_field: 'unknown_value',
    } as unknown as RawTwitterEventBody;

    const events = eventFactory(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(Events.UnknownEvent);
    expect(events[0].kind).toBe('message');
    expect(events[0].type).toBe('unknown');
    expect(events[0].forUserId).toBe(FOR_USER_ID);
  });
});
