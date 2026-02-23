import eventFactory from '../factory.js';
import * as Events from '../events.js';
import type { LineRawEvent } from '../../types.js';

const PROVIDER_ID = 'test-provider';
const CHANNEL_ID = 'test-channel';

describe('eventFactory', () => {
  test('TextMessageEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'message',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      message: {
        id: '444573844083572737',
        type: 'text',
        quoteToken: 'q3Plxr4AgKd...',
        markAsReadToken: '30yhdy232...',
        text: '@All @example Good Morning!! (love)',
        emojis: [
          {
            index: 29,
            length: 6,
            productId: '5ac1bfd5040ab15980c9b435',
            emojiId: '001',
          },
        ],
        mention: {
          mentionees: [
            {
              index: 0,
              length: 4,
              type: 'all',
            },
            {
              index: 5,
              length: 8,
              userId: 'U49585cd0d5...',
              type: 'user',
              isSelf: false,
            },
          ],
        },
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.TextMessageEvent);
    expect(event.type).toBe('text');
    expect(event.kind).toBe('message');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('ImageMessageEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'message',
      timestamp: 1627356924513,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: '7840b71058e24a5d91f9b5726c7512c9',
      mode: 'active',
      message: {
        type: 'image',
        id: '354718705033693859',
        quoteToken: 'q3Plxr4AgKd...',
        markAsReadToken: '30yhdy232...',
        contentProvider: {
          type: 'line',
        },
        imageSet: {
          id: 'E005D41A7288F41B65593ED38FF6E9834B046AB36A37921A56BC236F13A91855',
          index: 1,
          total: 2,
        },
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.ImageMessageEvent);
    expect(event.type).toBe('image');
    expect(event.kind).toBe('message');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('VideoMessageEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'message',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      message: {
        id: '325708',
        type: 'video',
        quoteToken: 'q3Plxr4AgKd...',
        markAsReadToken: '30yhdy232...',
        duration: 60000,
        contentProvider: {
          type: 'external',
          originalContentUrl: 'https://example.com/original.mp4',
          previewImageUrl: 'https://example.com/preview.jpg',
        },
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.VideoMessageEvent);
    expect(event.type).toBe('video');
    expect(event.kind).toBe('message');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('AudioMessageEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'message',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      message: {
        id: '325708',
        type: 'audio',
        markAsReadToken: '30yhdy232...',
        duration: 60000,
        contentProvider: {
          type: 'line',
        },
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.AudioMessageEvent);
    expect(event.type).toBe('audio');
    expect(event.kind).toBe('message');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('FileMessageEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'message',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      message: {
        id: '325708',
        type: 'file',
        markAsReadToken: '30yhdy232...',
        fileName: 'file.txt',
        fileSize: 2138,
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.FileMessageEvent);
    expect(event.type).toBe('file');
    expect(event.kind).toBe('message');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('LocationMessageEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'message',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      message: {
        id: '325708',
        type: 'location',
        markAsReadToken: '30yhdy232...',
        title: 'my location',
        address: '1-3 Kioicho, Chiyoda-ku, Tokyo, 102-8282 Japan',
        latitude: 35.67966,
        longitude: 139.73669,
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.LocationMessageEvent);
    expect(event.type).toBe('location');
    expect(event.kind).toBe('message');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('StickerMessageEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'message',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      message: {
        type: 'sticker',
        id: '1501597916',
        quoteToken: 'q3Plxr4AgKd...',
        markAsReadToken: '30yhdy232...',
        stickerId: '52002738',
        packageId: '11537',
        stickerResourceType: 'ANIMATION',
        keywords: [
          'cony',
          'sally',
          'Staring',
          'hi',
          'whatsup',
          'line',
          'howdy',
          'HEY',
          'Peeking',
          'wave',
          'peek',
          'Hello',
          'yo',
          'greetings',
        ],
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.StickerMessageEvent);
    expect(event.type).toBe('sticker');
    expect(event.kind).toBe('message');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('UnknownMessageEvent', () => {
    const payload: LineRawEvent = {
      type: 'message',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      message: {
        id: '325708',
        type: 'unknownMessageType',
      } as never,
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.UnknownEvent);
    expect(event.type).toBe('unknown');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('PostbackCallbackEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'postback',
      timestamp: 1513669370317,
      source: {
        userId: 'U91eeaf62d...',
        type: 'user',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'b60d432864f44d079f6d8efe86cf404b',
      mode: 'active',
      postback: {
        data: 'storeId=12345',
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.PostbackCallbackEvent);
    expect(event.type).toBe('postback');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('DatePostbackCallbackEvent', () => {
    const payload: LineRawEvent = {
      type: 'postback',
      timestamp: 1513669370317,
      source: {
        userId: 'U91eeaf62d...',
        type: 'user',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'b60d432864f44d079f6d8efe86cf404b',
      mode: 'active',
      postback: {
        data: 'storeId=12345',
        params: {
          date: '2017-12-25',
        },
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.DatePostbackCallbackEvent);
    expect(event.type).toBe('date_postback');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('TimePostbackCallbackEvent', () => {
    const payload: LineRawEvent = {
      type: 'postback',
      timestamp: 1513669370317,
      source: {
        userId: 'U91eeaf62d...',
        type: 'user',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'b60d432864f44d079f6d8efe86cf404b',
      mode: 'active',
      postback: {
        data: 'storeId=12345',
        params: {
          time: '01:00',
        },
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.TimePostbackCallbackEvent);
    expect(event.type).toBe('time_postback');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('DatetimePostbackCallbackEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'postback',
      timestamp: 1513669370317,
      source: {
        userId: 'U91eeaf62d...',
        type: 'user',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'b60d432864f44d079f6d8efe86cf404b',
      mode: 'active',
      postback: {
        data: 'storeId=12345',
        params: {
          datetime: '2017-12-25T01:00',
        },
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.DatetimePostbackCallbackEvent);
    expect(event.type).toBe('datetime_postback');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('UnknownPostbackEvent', () => {
    const payload: LineRawEvent = {
      type: 'postback',
      timestamp: 1513669370317,
      source: {
        userId: 'U91eeaf62d...',
        type: 'user',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'b60d432864f44d079f6d8efe86cf404b',
      mode: 'active',
      postback: {
        data: 'storeId=12345',
        params: {
          unknownType: 'unknown-value',
        } as never,
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.UnknownEvent);
    expect(event.type).toBe('unknown');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('UnsendActionEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'unsend',
      timestamp: 1462629479859,
      source: {
        type: 'group',
        groupId: 'Ca56f94637c...',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      mode: 'active',
      unsend: {
        messageId: '325708',
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.UnsendActionEvent);
    expect(event.type).toBe('unsend');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('FollowActionEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'follow',
      timestamp: 1705891467176,
      source: {
        type: 'user',
        userId: 'U3d3edab4f36c6292e6d8a8131f141b8b',
      },
      webhookEventId: '01HMQGW40RZJPJM3RAJP7BHC2Q',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: '85cbe770fa8b4f45bbe077b1d4be4a36',
      mode: 'active',
      follow: {
        isUnblocked: false,
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.FollowActionEvent);
    expect(event.type).toBe('follow');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('UnfollowActionEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'unfollow',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      mode: 'active',
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.UnfollowActionEvent);
    expect(event.type).toBe('unfollow');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('JoinActionEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'join',
      timestamp: 1462629479859,
      source: {
        type: 'group',
        groupId: 'C4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.JoinActionEvent);
    expect(event.type).toBe('join');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('LeaveActionEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'leave',
      timestamp: 1462629479859,
      source: {
        type: 'group',
        groupId: 'C4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      mode: 'active',
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.LeaveActionEvent);
    expect(event.type).toBe('leave');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('MemberJoinedActionEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'memberJoined',
      timestamp: 1462629479859,
      source: {
        type: 'group',
        groupId: 'C4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: '0f3779fba3b349968c5d07db31eabf65',
      mode: 'active',
      joined: {
        members: [
          {
            type: 'user',
            userId: 'U4af4980629...',
          },
          {
            type: 'user',
            userId: 'U91eeaf62d9...',
          },
        ],
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.MemberJoinedActionEvent);
    expect(event.type).toBe('member_joined');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('MemberLeftActionEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'memberLeft',
      timestamp: 1462629479960,
      source: {
        type: 'group',
        groupId: 'C4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      mode: 'active',
      left: {
        members: [
          {
            type: 'user',
            userId: 'U4af4980629...',
          },
          {
            type: 'user',
            userId: 'U91eeaf62d9...',
          },
        ],
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.MemberLeftActionEvent);
    expect(event.type).toBe('member_left');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('BeaconActionEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'beacon',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      beacon: {
        hwid: 'd41d8cd98f',
        type: 'enter',
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.BeaconActionEvent);
    expect(event.type).toBe('beacon');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('AccountLinkActionEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'accountLink',
      timestamp: 1513669370317,
      source: {
        userId: 'U91eeaf62d...',
        type: 'user',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'b60d432864f44d079f6d8efe86cf404b',
      mode: 'active',
      link: {
        result: 'ok',
        nonce: 'xxxxxxxxxxxxxxx',
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.AccountLinkActionEvent);
    expect(event.type).toBe('account_link');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('VideoPlayCompleteActionEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'videoPlayComplete',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      videoPlayComplete: {
        trackingId: 'track-id',
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.VideoPlayCompleteActionEvent);
    expect(event.type).toBe('video_play_complete');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('MembershipJoinedActionEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'membership',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      membership: {
        type: 'joined',
        membershipId: 3189,
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.MembershipJoinedActionEvent);
    expect(event.type).toBe('membership_joined');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('MembershipLeftActionEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'membership',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      membership: {
        type: 'left',
        membershipId: 3189,
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.MembershipLeftActionEvent);
    expect(event.type).toBe('membership_left');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('MembershipRenewedActionEvent', () => {
    // Example from LINE API documentation
    const payload: LineRawEvent = {
      type: 'membership',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      membership: {
        type: 'renewed',
        membershipId: 3189,
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.MembershipRenewedActionEvent);
    expect(event.type).toBe('membership_renewed');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('UnknownMembershipEvent', () => {
    const payload: LineRawEvent = {
      type: 'membership',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      membership: {
        type: 'unknown' as any,
        membershipId: 3189,
      },
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.UnknownEvent);
    expect(event.type).toBe('unknown');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('UnknownEvent', () => {
    const payload: LineRawEvent = {
      type: 'unknownEventType',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      mode: 'active',
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.UnknownEvent);
    expect(event.type).toBe('unknown');
    expect(event.providerId).toBe(PROVIDER_ID);
    expect(event.channelId).toBe(CHANNEL_ID);
    expect(event.payload).toBe(payload);
  });

  test('MessageEventWithMissingMessage', () => {
    const payload: LineRawEvent = {
      type: 'message',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      // message is undefined
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.UnknownEvent);
    expect(event.type).toBe('unknown');
  });

  test('PostbackEventWithMissingPostback', () => {
    const payload: LineRawEvent = {
      type: 'postback',
      timestamp: 1513669370317,
      source: {
        userId: 'U91eeaf62d...',
        type: 'user',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'b60d432864f44d079f6d8efe86cf404b',
      mode: 'active',
      // postback is undefined
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.PostbackCallbackEvent);
    expect(event.type).toBe('postback');
  });

  test('ThingsEventWithMissingThings', () => {
    const payload: LineRawEvent = {
      type: 'things',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980629...',
      },
      webhookEventId: '01FZ74A0TDDPYRVKNK77XKC3ZR',
      deliveryContext: {
        isRedelivery: false,
      },
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      mode: 'active',
      // things is undefined
    };

    const event = eventFactory(PROVIDER_ID, CHANNEL_ID, payload);

    expect(event).toBeInstanceOf(Events.UnknownEvent);
    expect(event.type).toBe('unknown');
  });
});
