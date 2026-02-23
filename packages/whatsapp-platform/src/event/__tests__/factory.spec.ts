import eventFactory from '../factory.js';
import {
  TextMessageEvent,
  AudioMessageEvent,
  ImageMessageEvent,
  DocumentMessageEvent,
  VideoMessageEvent,
  StickerMessageEvent,
  ContactsMessageEvent,
  ButtonInteractiveEvent,
  ListInteractiveEvent,
  QuickReplyEvent,
  UserIdentityChangeEvent,
  UserNumberChangeEvent,
  UnknownMessageEvent,
  ReadEvent,
  SentEvent,
  DeliveredEvent,
  FailedEvent,
  ErrorEvent,
  UnknownEvent,
} from '../events.js';
import type { WhatsAppRawEvent } from '../../types.js';

// Based on https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components

const BUSINESS_ACCOUNT_ID = '102290129340398';
const PHONE_NUMBER_ID = '106540352242922';
const DISPLAY_PHONE_NUMBER = '15550783881';
const USER_WA_ID = '16505551234';
const USER_NAME = 'Sheena Nelson';
const TIMESTAMP = '1739321024';
const WAMID = 'wamid.HBgLMTY1MDM4Nzk0MzkVAgASGBQzQTRBNjU5OUFFRTkzRTExNkMwQQ==';

const makeEntry = (
  value: WhatsAppRawEvent['entry'][0]['changes'][0]['value'],
): WhatsAppRawEvent['entry'][0] => ({
  id: BUSINESS_ACCOUNT_ID,
  changes: [{ value, field: 'messages' }],
});

const baseValue = {
  messaging_product: 'whatsapp' as const,
  metadata: {
    phone_number_id: PHONE_NUMBER_ID,
    display_phone_number: DISPLAY_PHONE_NUMBER,
  },
  contacts: [{ profile: { name: USER_NAME }, wa_id: USER_WA_ID }],
};

describe('TextMessageEvent', () => {
  it('creates a text message event from webhook payload', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'text',
          text: { body: 'Hello!' },
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(TextMessageEvent);

    const e = event as TextMessageEvent;
    expect(e.kind).toBe('message');
    expect(e.type).toBe('text');
    expect(e.platform).toBe('whatsapp');
    expect(e.businessAccountId).toBe(BUSINESS_ACCOUNT_ID);
    expect(e.agentNumberId).toBe(PHONE_NUMBER_ID);
    expect(e.agentNumberDisplay).toBe(DISPLAY_PHONE_NUMBER);
    expect(e.messageId).toBe(WAMID);
    expect(e.userNumberId).toBe(USER_WA_ID);
    expect(e.text).toBe('Hello!');
    expect(e.time).toEqual(new Date(Number(TIMESTAMP) * 1000));
    expect(e.thread.uid).toBe(`whatsapp.${PHONE_NUMBER_ID}.${USER_WA_ID}`);
    expect(e.user.uid).toBe(`whatsapp.${USER_WA_ID}`);
    expect(e.userProfile?.name).toBe(USER_NAME);
    expect(e.agent.uid).toBe(`whatsapp.${PHONE_NUMBER_ID}`);
  });

  it('creates a text message event with referral data', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'text',
          text: { body: 'Hi there' },
          referral: {
            source_url: 'https://fb.me/3cr4Wqqkv',
            source_id: '120226305854810726',
            source_type: 'ad',
            headline: 'Chat with us',
            body: 'Summer succulents are here!',
            media_type: 'image',
            image_url: 'https://scontent.xx.fbcdn.net/v/t45.1600-4/example.jpg',
            ctwa_clid: 'Aff-n8ZTODiE79d22KtAwQKj9e',
          },
        },
      ],
    });

    const [event] = eventFactory(entry);
    const e = event as TextMessageEvent;

    expect(e.text).toBe('Hi there');
    expect(e.hasReferralData).toBe(true);
    expect(e.sourceUrl).toBe('https://fb.me/3cr4Wqqkv');
    expect(e.sourceType).toBe('ad');
    expect(e.sourceId).toBe('120226305854810726');
    expect(e.headline).toBe('Chat with us');
    expect(e.body).toBe('Summer succulents are here!');
    expect(e.mediaType).toBe('image');
    expect(e.imageUrl).toBe(
      'https://scontent.xx.fbcdn.net/v/t45.1600-4/example.jpg',
    );
  });
});

describe('AudioMessageEvent', () => {
  it('creates an audio message event', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'audio',
          audio: {
            mime_type: 'audio/ogg; codecs=opus',
            sha256: 'SfInY0gGKTsJlUWbwxC1k+FAD0FZHvzwfpvO0zX0GUI=',
            id: '1003383421387256',
          },
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(AudioMessageEvent);

    const e = event as AudioMessageEvent;
    expect(e.kind).toBe('message');
    expect(e.type).toBe('audio');
    expect(e.mediaId).toBe('1003383421387256');
    expect(e.mimeType).toBe('audio/ogg; codecs=opus');
  });
});

describe('ImageMessageEvent', () => {
  it('creates an image message event', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'image',
          image: {
            caption: 'Taj Mahal',
            mime_type: 'image/jpeg',
            sha256: 'SfInY0gGKTsJlUWbwxC1k+FAD0FZHvzwfpvO0zX0GUI=',
            id: '1003383421387256',
          },
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(ImageMessageEvent);

    const e = event as ImageMessageEvent;
    expect(e.kind).toBe('message');
    expect(e.type).toBe('image');
    expect(e.mediaId).toBe('1003383421387256');
    expect(e.mimeType).toBe('image/jpeg');
    expect(e.sha256).toBe('SfInY0gGKTsJlUWbwxC1k+FAD0FZHvzwfpvO0zX0GUI=');
    expect(e.caption).toBe('Taj Mahal');
  });

  it('supports referral data on image message', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'image',
          image: {
            mime_type: 'image/jpeg',
            sha256: 'abc123',
            id: '999',
          },
          referral: {
            source_url: 'https://fb.me/ad123',
            source_id: '555',
            source_type: 'post',
            headline: 'Check this',
            body: 'New arrivals',
            media_type: 'video',
            video_url: 'https://example.com/video.mp4',
            thumbnail_url: 'https://example.com/thumb.jpg',
          },
        },
      ],
    });

    const [event] = eventFactory(entry);
    const e = event as ImageMessageEvent;

    expect(e.hasReferralData).toBe(true);
    expect(e.sourceType).toBe('post');
    expect(e.videoUrl).toBe('https://example.com/video.mp4');
    expect(e.thumbnailUrl).toBe('https://example.com/thumb.jpg');
  });
});

describe('VideoMessageEvent', () => {
  it('creates a video message event', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'video',
          video: {
            caption: 'Taj Mahal',
            mime_type: 'video/mp4',
            sha256: 'SfInY0gGKTsJlUWbwxC1k+FAD0FZHvzwfpvO0zX0GUI=',
            id: '1003383421387256',
            filename: 'video.mp4',
          },
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(VideoMessageEvent);

    const e = event as VideoMessageEvent;
    expect(e.kind).toBe('message');
    expect(e.type).toBe('video');
    expect(e.mediaId).toBe('1003383421387256');
    expect(e.mimeType).toBe('video/mp4');
    expect(e.sha256).toBe('SfInY0gGKTsJlUWbwxC1k+FAD0FZHvzwfpvO0zX0GUI=');
    expect(e.caption).toBe('Taj Mahal');
    expect(e.filename).toBe('video.mp4');
  });
});

describe('DocumentMessageEvent', () => {
  it('creates a document message event', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'document',
          document: {
            caption: 'my receipt',
            filename: 'receipt.pdf',
            mime_type: 'application/pdf',
            sha256: 'SfInY0gGKTsJlUWbwxC1k+FAD0FZHvzwfpvO0zX0GUI=',
            id: '1003383421387256',
          },
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(DocumentMessageEvent);

    const e = event as DocumentMessageEvent;
    expect(e.kind).toBe('message');
    expect(e.type).toBe('document');
    expect(e.mediaId).toBe('1003383421387256');
    expect(e.mimeType).toBe('application/pdf');
    expect(e.sha256).toBe('SfInY0gGKTsJlUWbwxC1k+FAD0FZHvzwfpvO0zX0GUI=');
    expect(e.caption).toBe('my receipt');
    expect(e.filename).toBe('receipt.pdf');
  });
});

describe('StickerMessageEvent', () => {
  it('creates a sticker message event', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'sticker',
          sticker: {
            mime_type: 'image/webp',
            sha256: 'SfInY0gGKTsJlUWbwxC1k+FAD0FZHvzwfpvO0zX0GUI=',
            id: '1003383421387256',
          },
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(StickerMessageEvent);

    const e = event as StickerMessageEvent;
    expect(e.kind).toBe('message');
    expect(e.type).toBe('sticker');
    expect(e.mediaId).toBe('1003383421387256');
    expect(e.mimeType).toBe('image/webp');
    expect(e.sha256).toBe('SfInY0gGKTsJlUWbwxC1k+FAD0FZHvzwfpvO0zX0GUI=');
  });
});

describe('ContactsMessageEvent', () => {
  it('creates a contacts message event', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'contacts',
          contacts: [
            {
              name: {
                formatted_name: 'John Smith',
                first_name: 'John',
                last_name: 'Smith',
              },
              phones: [
                {
                  phone: '+1 (940) 555-1234',
                  type: 'HOME',
                  wa_id: '19405551234',
                },
              ],
            },
          ],
        } as any,
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(ContactsMessageEvent);

    const e = event as ContactsMessageEvent;
    expect(e.kind).toBe('message');
    expect(e.type).toBe('contacts');
    expect(e.messageId).toBe(WAMID);
  });
});

describe('ButtonInteractiveEvent', () => {
  it('creates a button interactive event', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          context: {
            from: DISPLAY_PHONE_NUMBER,
            id: 'wamid.CONTEXT_ID',
          },
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'interactive',
          interactive: {
            type: 'button_reply',
            button_reply: {
              id: 'cancel-button',
              title: 'Cancel',
            },
          },
        } as any,
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(ButtonInteractiveEvent);

    const e = event as ButtonInteractiveEvent;
    expect(e.kind).toBe('callback');
    expect(e.type).toBe('button_interactive');
    expect(e.callbackData).toBe('cancel-button');
    expect(e.title).toBe('Cancel');
  });
});

describe('ListInteractiveEvent', () => {
  it('creates a list interactive event', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          context: {
            from: DISPLAY_PHONE_NUMBER,
            id: 'wamid.CONTEXT_ID',
          },
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'interactive',
          interactive: {
            type: 'list_reply',
            list_reply: {
              id: 'priority_express',
              title: 'Priority Mail Express',
              description: 'Next Day to 2 Days',
            },
          },
        } as any,
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(ListInteractiveEvent);

    const e = event as ListInteractiveEvent;
    expect(e.kind).toBe('callback');
    expect(e.type).toBe('list_interactive');
    expect(e.callbackData).toBe('priority_express');
    expect(e.title).toBe('Priority Mail Express');
    expect(e.description).toBe('Next Day to 2 Days');
  });
});

describe('QuickReplyEvent', () => {
  it('creates a quick reply event', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'button',
          button: {
            payload: 'PAYLOAD_DATA',
            text: 'Yes',
          },
        } as any,
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(QuickReplyEvent);

    const e = event as QuickReplyEvent;
    expect(e.kind).toBe('callback');
    expect(e.type).toBe('quick_reply');
  });
});

describe('UserIdentityChangeEvent', () => {
  it('creates a user identity change event', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'system',
          system: {
            body: 'User identity changed',
            identity: 'DF2lS5v2W6x=',
            wa_id: USER_WA_ID,
          },
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(UserIdentityChangeEvent);

    const e = event as UserIdentityChangeEvent;
    expect(e.kind).toBe('system');
    expect(e.type).toBe('user_identity_change');
    expect(e.changeId).toBe('DF2lS5v2W6x=');
    expect(e.description).toBe('User identity changed');
    expect(e.originalNumber).toBe(USER_WA_ID);
  });
});

describe('UserNumberChangeEvent', () => {
  it('creates a user number change event', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'system',
          system: {
            body: 'User changed from 16505551234 to 16505559999',
            new_wa_id: '16505559999',
            wa_id: USER_WA_ID,
          },
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(UserNumberChangeEvent);

    const e = event as UserNumberChangeEvent;
    expect(e.kind).toBe('system');
    expect(e.type).toBe('user_number_change');
    expect(e.newNumber).toBe('16505559999');
    expect(e.description).toBe('User changed from 16505551234 to 16505559999');
    expect(e.originalNumber).toBe(USER_WA_ID);
  });
});

describe('UnknownMessageEvent', () => {
  it('creates an unknown message event for unsupported type', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'unknown',
          errors: [
            {
              code: 131051,
              title: 'Unsupported message type',
              error_data: {
                details: 'Message type is not currently supported',
              },
            },
          ],
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(UnknownMessageEvent);

    const e = event as UnknownMessageEvent;
    expect(e.kind).toBe('message');
    expect(e.type).toBe('unknown');
    expect(e.errorCode).toBe(131051);
    expect(e.errorTitle).toBe('Unsupported message type');
    expect(e.errorDetails).toBe('Message type is not currently supported');
  });

  it('creates an unknown message event for unrecognized type', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'some_future_type' as any,
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(UnknownMessageEvent);
  });
});

describe('Status events', () => {
  it('creates a SentEvent', () => {
    const entry = makeEntry({
      messaging_product: 'whatsapp',
      metadata: {
        phone_number_id: PHONE_NUMBER_ID,
        display_phone_number: DISPLAY_PHONE_NUMBER,
      },
      statuses: [
        {
          id: WAMID,
          status: 'sent',
          timestamp: '1750030073',
          recipient_id: USER_WA_ID,
          conversation: {
            id: '8f842dbba350821654c9dfed31f5635c',
            expiration_timestamp: '1750116473',
            origin: { type: 'business_initiated' },
          },
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(SentEvent);

    const e = event as SentEvent;
    expect(e.kind).toBe('system');
    expect(e.type).toBe('sent');
    expect(e.messageId).toBe(WAMID);
    expect(e.userNumberId).toBe(USER_WA_ID);
    expect(e.time).toEqual(new Date(1750030073 * 1000));
    expect(e.conversationId).toBe('8f842dbba350821654c9dfed31f5635c');
    expect(e.conversationOriginType).toBe('business_initiated');
    expect(e.conversationExpireTime).toEqual(new Date(1750116473 * 1000));
    expect(e.thread.uid).toBe(`whatsapp.${PHONE_NUMBER_ID}.${USER_WA_ID}`);
    expect(e.user.uid).toBe(`whatsapp.${USER_WA_ID}`);
  });

  it('creates a DeliveredEvent', () => {
    const entry = makeEntry({
      messaging_product: 'whatsapp',
      metadata: {
        phone_number_id: PHONE_NUMBER_ID,
        display_phone_number: DISPLAY_PHONE_NUMBER,
      },
      statuses: [
        {
          id: 'wamid.HBgLMTY1MDM4Nzk0MzkVAgARGBI3MTE5MjVBOTE3MDk5QUVFM0YA',
          status: 'delivered',
          timestamp: '1750263773',
          recipient_id: USER_WA_ID,
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(DeliveredEvent);

    const e = event as DeliveredEvent;
    expect(e.kind).toBe('system');
    expect(e.type).toBe('delivered');
    expect(e.time).toEqual(new Date(1750263773 * 1000));
  });

  it('creates a ReadEvent', () => {
    const entry = makeEntry({
      messaging_product: 'whatsapp',
      metadata: {
        phone_number_id: PHONE_NUMBER_ID,
        display_phone_number: DISPLAY_PHONE_NUMBER,
      },
      statuses: [
        {
          id: WAMID,
          status: 'read',
          timestamp: '1750030073',
          recipient_id: USER_WA_ID,
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(ReadEvent);

    const e = event as ReadEvent;
    expect(e.kind).toBe('action');
    expect(e.type).toBe('read');
  });

  it('creates a FailedEvent', () => {
    const entry = makeEntry({
      messaging_product: 'whatsapp',
      metadata: {
        phone_number_id: PHONE_NUMBER_ID,
        display_phone_number: DISPLAY_PHONE_NUMBER,
      },
      statuses: [
        {
          id: WAMID,
          status: 'failed',
          timestamp: '1750030073',
          recipient_id: USER_WA_ID,
          errors: [
            {
              code: 131047,
              title: 'Re-engagement message',
            },
          ],
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(FailedEvent);

    const e = event as FailedEvent;
    expect(e.kind).toBe('system');
    expect(e.type).toBe('failed');
  });
});

describe('ErrorEvent', () => {
  it('creates an error event', () => {
    const entry = makeEntry({
      messaging_product: 'whatsapp',
      metadata: {
        phone_number_id: PHONE_NUMBER_ID,
        display_phone_number: DISPLAY_PHONE_NUMBER,
      },
      errors: [
        {
          code: 130429,
          title: 'Rate limit hit',
          message: 'Rate limit hit',
          error_data: {
            details:
              'Message failed to send because there were too many messages sent from this phone number in a short period of time',
          },
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(ErrorEvent);

    const e = event as ErrorEvent;
    expect(e.kind).toBe('system');
    expect(e.type).toBe('error');
    expect(e.code).toBe(130429);
    expect(e.title).toBe('Rate limit hit');
    expect(e.thread).toBeNull();
    expect(e.user).toBeNull();
  });
});

describe('multiple events', () => {
  it('creates events for messages, statuses, and errors in a single update', () => {
    const entry = makeEntry({
      messaging_product: 'whatsapp',
      metadata: {
        phone_number_id: PHONE_NUMBER_ID,
        display_phone_number: DISPLAY_PHONE_NUMBER,
      },
      contacts: [{ profile: { name: USER_NAME }, wa_id: USER_WA_ID }],
      messages: [
        {
          from: USER_WA_ID,
          id: 'wamid.MSG1',
          timestamp: TIMESTAMP,
          type: 'text',
          text: { body: 'First' },
        },
        {
          from: USER_WA_ID,
          id: 'wamid.MSG2',
          timestamp: TIMESTAMP,
          type: 'text',
          text: { body: 'Second' },
        },
      ],
      statuses: [
        {
          id: 'wamid.STATUS1',
          status: 'delivered',
          timestamp: '1750263773',
          recipient_id: USER_WA_ID,
        },
      ],
      errors: [
        {
          code: 130429,
          title: 'Rate limit hit',
        },
      ],
    });

    const events = eventFactory(entry);
    expect(events).toHaveLength(4);
    expect(events[0]).toBeInstanceOf(TextMessageEvent);
    expect(events[1]).toBeInstanceOf(TextMessageEvent);
    expect(events[2]).toBeInstanceOf(DeliveredEvent);
    expect(events[3]).toBeInstanceOf(ErrorEvent);
  });
});

describe('user profile matching', () => {
  it('matches contact profile to message by wa_id', () => {
    const entry = makeEntry({
      ...baseValue,
      contacts: [
        { profile: { name: 'Alice' }, wa_id: '11111111111' },
        { profile: { name: 'Bob' }, wa_id: USER_WA_ID },
      ],
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'text',
          text: { body: 'Hello' },
        },
      ],
    });

    const [event] = eventFactory(entry);
    const e = event as TextMessageEvent;
    expect(e.userProfile?.name).toBe('Bob');
  });

  it('handles missing contacts gracefully', () => {
    const entry = makeEntry({
      messaging_product: 'whatsapp',
      metadata: {
        phone_number_id: PHONE_NUMBER_ID,
        display_phone_number: DISPLAY_PHONE_NUMBER,
      },
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'text',
          text: { body: 'Hello' },
        },
      ],
    });

    const [event] = eventFactory(entry);
    const e = event as TextMessageEvent;
    expect(e.userProfile).toBeUndefined();
  });
});

describe('UnknownEvent', () => {
  it('creates an unknown event for unrecognized status type', () => {
    const entry = makeEntry({
      messaging_product: 'whatsapp',
      metadata: {
        phone_number_id: PHONE_NUMBER_ID,
        display_phone_number: DISPLAY_PHONE_NUMBER,
      },
      statuses: [
        {
          id: WAMID,
          status: 'some_future_status' as any,
          timestamp: '1750030073',
          recipient_id: USER_WA_ID,
        },
      ],
    });

    const [event] = eventFactory(entry);
    expect(event).toBeInstanceOf(UnknownEvent);

    const e = event as UnknownEvent;
    expect(e.kind).toBe('message');
    expect(e.type).toBe('unknown');
    expect(e.platform).toBe('whatsapp');
    expect(e.businessAccountId).toBe(BUSINESS_ACCOUNT_ID);
    expect(e.agentNumberId).toBe(PHONE_NUMBER_ID);
    expect(e.agentNumberDisplay).toBe(DISPLAY_PHONE_NUMBER);
    expect(e.thread).toBeNull();
    expect(e.user).toBeNull();
  });
});

describe('Referral mixin defaults', () => {
  it('returns defaults when no referral data is present', () => {
    const entry = makeEntry({
      ...baseValue,
      messages: [
        {
          from: USER_WA_ID,
          id: WAMID,
          timestamp: TIMESTAMP,
          type: 'text',
          text: { body: 'No ad' },
        },
      ],
    });

    const [event] = eventFactory(entry);
    const e = event as TextMessageEvent;

    expect(e.hasReferralData).toBe(false);
    expect(e.sourceUrl).toBe('');
    expect(e.sourceId).toBe('');
    expect(e.headline).toBe('');
    expect(e.imageUrl).toBeUndefined();
    expect(e.videoUrl).toBeUndefined();
    expect(e.thumbnailUrl).toBeUndefined();
  });
});
