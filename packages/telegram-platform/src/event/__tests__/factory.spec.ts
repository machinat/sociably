import eventFactory from '../factory.js';
import * as Events from '../events.js';
import type { TelegramRawEvent } from '../../types.js';

const BOT_ID = 12345;

describe('eventFactory', () => {
  it('TextMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10000,
      message: {
        message_id: 1365,
        date: 1441645532,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        text: 'Hello World',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.TextMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('text');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('EditTextMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10001,
      edited_message: {
        message_id: 1365,
        date: 1441645532,
        edit_date: 1441645545,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        text: 'Hello World (edited)',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.EditTextMessageEvent);
    expect(event.kind).toBe('edit_message');
    expect(event.type).toBe('text');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('TextChannelPostEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10002,
      channel_post: {
        message_id: 1366,
        date: 1441645533,
        chat: {
          id: -1001234567890,
          type: 'channel',
          title: 'Test Channel',
          username: 'testchannel',
        },
        text: 'Channel Post',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.TextChannelPostEvent);
    expect(event.kind).toBe('channel_post');
    expect(event.type).toBe('text');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('EditTextChannelPostEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10003,
      edited_channel_post: {
        message_id: 1366,
        date: 1441645533,
        edit_date: 1441645550,
        chat: {
          id: -1001234567890,
          type: 'channel',
          title: 'Test Channel',
          username: 'testchannel',
        },
        text: 'Channel Post (edited)',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.EditTextChannelPostEvent);
    expect(event.kind).toBe('edit_channel_post');
    expect(event.type).toBe('text');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('AnimationMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10004,
      message: {
        message_id: 1367,
        date: 1441645534,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        animation: {
          file_id: 'BAADBAADbwADBREAAYdVAAGmgf8AAg',
          file_unique_id: 'AgADbwADBREAAQ',
          width: 320,
          height: 240,
          duration: 10,
          thumbnail: {
            file_id: 'AAQFABNexvo4AAR0xalVBBYACwABAg',
            file_unique_id: 'AQAD0xalVBBYAAcAAQ',
            width: 90,
            height: 68,
            file_size: 1478,
          },
          file_name: 'animation.gif',
          mime_type: 'image/gif',
          file_size: 3897,
        },
        caption: 'Animation Caption',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.AnimationMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('animation');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('AudioMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10005,
      message: {
        message_id: 1368,
        date: 1441645535,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        audio: {
          file_id: 'BAADBAADbwADBREAAYdVAAGmgf8AAg',
          file_unique_id: 'AgADbwADBREAAQ',
          duration: 180,
          performer: 'Artist',
          title: 'Song Title',
          file_name: 'audio.mp3',
          mime_type: 'audio/mpeg',
          file_size: 5242880,
        },
        caption: 'Audio Caption',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.AudioMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('audio');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('DocumentMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10006,
      message: {
        message_id: 1369,
        date: 1441645536,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        document: {
          file_id: 'BAADBAADbwADBREAAYdVAAGmgf8AAg',
          file_unique_id: 'AgADbwADBREAAQ',
          file_name: 'document.pdf',
          mime_type: 'application/pdf',
          file_size: 1048576,
        },
        caption: 'Document Caption',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.DocumentMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('document');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('PhotoMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10007,
      message: {
        message_id: 1370,
        date: 1441645537,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        photo: [
          {
            file_id:
              'AgADBAADGTo4Gx1zBRA-EvAAAYiVAAMsCo8g1FNjJ8dC4QAEfwIADBAAA',
            file_unique_id: 'AQADB7MsCo8g1FNjAQAB',
            width: 90,
            height: 68,
            file_size: 1478,
          },
          {
            file_id:
              'AgADBAADGTo4Gx1zBRA-EvAAAYiVAAMsCo8g1FNjJ8dC4QAEfwIADxAAA',
            file_unique_id: 'AQADB7MsCo8g1FNjAAIB',
            width: 320,
            height: 240,
            file_size: 15613,
          },
        ],
        caption: 'Photo Caption',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.PhotoMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('photo');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('StickerMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10008,
      message: {
        message_id: 1371,
        date: 1441645538,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        sticker: {
          file_id: 'BAADBAADbwADBREAAYdVAAGmgf8AAg',
          file_unique_id: 'AgADbwADBREAAQ',
          type: 'regular' as const,
          width: 512,
          height: 512,
          is_animated: false,
          is_video: false,
          emoji: '😀',
          set_name: 'StickerSet',
          file_size: 39518,
        },
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.StickerMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('sticker');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('VideoMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10009,
      message: {
        message_id: 1372,
        date: 1441645539,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        video: {
          file_id: 'BAADBAADbwADBREAAYdVAAGmgf8AAg',
          file_unique_id: 'AgADbwADBREAAQ',
          width: 1280,
          height: 720,
          duration: 60,
          thumbnail: {
            file_id: 'AAQFABNexvo4AAR0xalVBBYACwABAg',
            file_unique_id: 'AQAD0xalVBBYAAcAAQ',
            width: 320,
            height: 180,
            file_size: 5000,
          },
          file_name: 'video.mp4',
          mime_type: 'video/mp4',
          file_size: 10485760,
        },
        caption: 'Video Caption',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.VideoMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('video');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('VideoNoteMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10010,
      message: {
        message_id: 1373,
        date: 1441645540,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        video_note: {
          file_id: 'BAADBAADbwADBREAAYdVAAGmgf8AAg',
          file_unique_id: 'AgADbwADBREAAQ',
          length: 240,
          duration: 10,
          thumbnail: {
            file_id: 'AAQFABNexvo4AAR0xalVBBYACwABAg',
            file_unique_id: 'AQAD0xalVBBYAAcAAQ',
            width: 240,
            height: 240,
            file_size: 2000,
          },
          file_size: 1048576,
        },
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.VideoNoteMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('video_note');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('VoiceMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10011,
      message: {
        message_id: 1374,
        date: 1441645541,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        voice: {
          file_id: 'AwADBAADbwADBREAAYdVAAGmgf8AAg',
          file_unique_id: 'AgADbwADBREAAQ',
          duration: 30,
          mime_type: 'audio/ogg',
          file_size: 65536,
        },
        caption: 'Voice Caption',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.VoiceMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('voice');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('ContactMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10012,
      message: {
        message_id: 1375,
        date: 1441645542,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        contact: {
          phone_number: '+1234567890',
          first_name: 'John',
          last_name: 'Doe',
          user_id: 123456789,
          vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nEND:VCARD',
        },
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.ContactMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('contact');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('DiceMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10013,
      message: {
        message_id: 1376,
        date: 1441645543,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        dice: {
          emoji: '🎲',
          value: 4,
        },
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.DiceMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('dice');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('GameMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10014,
      message: {
        message_id: 1377,
        date: 1441645544,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        game: {
          title: 'Test Game',
          description: 'A test game',
          photo: [
            {
              file_id:
                'AgADBAADGTo4Gx1zBRA-EvAAAYiVAAMsCo8g1FNjJ8dC4QAEfwIADBAAA',
              file_unique_id: 'AQADB7MsCo8g1FNjAQAB',
              width: 320,
              height: 240,
              file_size: 15613,
            },
          ],
          text: 'High Score: 100',
        },
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.GameMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('game');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('PollMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10015,
      message: {
        message_id: 1378,
        date: 1441645545,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        poll: {
          id: '5027987376309834547',
          question: 'What is your favorite color?',
          options: [
            { text: 'Red', voter_count: 2 },
            { text: 'Blue', voter_count: 3 },
            { text: 'Green', voter_count: 1 },
          ],
          total_voter_count: 6,
          is_closed: false,
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
        },
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.PollMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('poll');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('VenueMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10016,
      message: {
        message_id: 1379,
        date: 1441645546,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        venue: {
          location: {
            longitude: -122.08,
            latitude: 37.42,
          },
          title: 'Test Venue',
          address: '1600 Amphitheatre Parkway, Mountain View, CA',
          foursquare_id: '4bf58dd8d48988d181941735',
          foursquare_type: 'venue/outdoor',
        },
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.VenueMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('venue');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('LocationMessageEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10017,
      message: {
        message_id: 1380,
        date: 1441645547,
        chat: {
          id: 1111111,
          type: 'private',
          first_name: 'Test',
          username: 'Test',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        location: {
          longitude: -122.08,
          latitude: 37.42,
        },
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.LocationMessageEvent);
    expect(event.kind).toBe('message');
    expect(event.type).toBe('location');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('NewChatMembersActionEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10018,
      message: {
        message_id: 1381,
        date: 1441645548,
        chat: {
          id: -1001234567890,
          type: 'supergroup',
          title: 'Test Group',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        new_chat_members: [
          {
            id: 2222222,
            is_bot: false,
            first_name: 'NewUser',
            username: 'newuser',
          },
        ],
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.NewChatMembersActionEvent);
    expect(event.kind).toBe('action');
    expect(event.type).toBe('new_chat_members');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('LeftChatMemberActionEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10019,
      message: {
        message_id: 1382,
        date: 1441645549,
        chat: {
          id: -1001234567890,
          type: 'supergroup',
          title: 'Test Group',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        left_chat_member: {
          id: 2222222,
          is_bot: false,
          first_name: 'LeftUser',
          username: 'leftuser',
        },
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.LeftChatMemberActionEvent);
    expect(event.kind).toBe('action');
    expect(event.type).toBe('left_chat_member');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('NewChatTitleActionEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10020,
      message: {
        message_id: 1383,
        date: 1441645550,
        chat: {
          id: -1001234567890,
          type: 'supergroup',
          title: 'New Group Title',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        new_chat_title: 'New Group Title',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.NewChatTitleActionEvent);
    expect(event.kind).toBe('action');
    expect(event.type).toBe('new_chat_title');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('CallbackQueryCallbackEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10021,
      callback_query: {
        id: '4382bfdwdsb323b2d9',
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        message: {
          message_id: 1365,
          date: 1441645532,
          chat: {
            id: 1111111,
            type: 'private',
            first_name: 'Test',
            username: 'Test',
          },
          from: {
            id: 987654321,
            is_bot: true,
            first_name: 'Bot',
            username: 'testbot',
          },
          text: 'Choose option:',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Option 1',
                  callback_data: 'option_1',
                },
              ],
            ],
          },
        },
        chat_instance: '-3543456739217765',
        data: 'option_1',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.CallbackQueryCallbackEvent);
    expect(event.kind).toBe('callback');
    expect(event.type).toBe('callback_query');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('InlineQueryCallbackEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10022,
      inline_query: {
        id: '134567890987654321',
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        query: 'test query',
        offset: '0',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.InlineQueryCallbackEvent);
    expect(event.kind).toBe('callback');
    expect(event.type).toBe('inline_query');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('ChooseInlineResultCallbackEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10023,
      chosen_inline_result: {
        result_id: 'test_result_id',
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        query: 'test query',
        inline_message_id: 'BAAwl3hgqiGKo20h',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.ChooseInlineResultCallbackEvent);
    expect(event.kind).toBe('callback');
    expect(event.type).toBe('choose_inline_result');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('ShippingQueryCallbackEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10024,
      shipping_query: {
        id: '123456789012345',
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        invoice_payload: 'test_invoice_payload',
        shipping_address: {
          country_code: 'US',
          state: 'CA',
          city: 'Mountain View',
          street_line1: '1600 Amphitheatre Parkway',
          street_line2: '',
          post_code: '94043',
        },
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.ShippingQueryCallbackEvent);
    expect(event.kind).toBe('callback');
    expect(event.type).toBe('shipping_query');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('PreCheckoutQueryCallbackEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10025,
      pre_checkout_query: {
        id: '123456789012345',
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        currency: 'USD',
        total_amount: 1000,
        invoice_payload: 'test_invoice_payload',
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.PreCheckoutQueryCallbackEvent);
    expect(event.kind).toBe('callback');
    expect(event.type).toBe('pre_checkout_query');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('PollChangeCallbackEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10026,
      poll: {
        id: '5027987376309834547',
        question: 'What is your favorite color?',
        options: [
          { text: 'Red', voter_count: 3 },
          { text: 'Blue', voter_count: 4 },
          { text: 'Green', voter_count: 2 },
        ],
        total_voter_count: 9,
        is_closed: false,
        is_anonymous: true,
        type: 'regular',
        allows_multiple_answers: false,
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.PollChangeCallbackEvent);
    expect(event.kind).toBe('callback');
    expect(event.type).toBe('poll_change');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('PollAnswerChangeCallbackEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10027,
      poll_answer: {
        poll_id: '5027987376309834547',
        user: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        option_ids: [1],
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.PollAnswerChangeCallbackEvent);
    expect(event.kind).toBe('callback');
    expect(event.type).toBe('poll_answer_change');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('BotMemberUpdatedActionEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10028,
      my_chat_member: {
        chat: {
          id: -1001234567890,
          type: 'supergroup',
          title: 'Test Group',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        date: 1441645551,
        old_chat_member: {
          user: {
            id: 987654321,
            is_bot: true,
            first_name: 'Bot',
            username: 'testbot',
          },
          status: 'left',
        },
        new_chat_member: {
          user: {
            id: 987654321,
            is_bot: true,
            first_name: 'Bot',
            username: 'testbot',
          },
          status: 'member',
        },
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.BotMemberUpdatedActionEvent);
    expect(event.kind).toBe('action');
    expect(event.type).toBe('bot_member_updated');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('ChatMemberUpdatedActionEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10029,
      chat_member: {
        chat: {
          id: -1001234567890,
          type: 'supergroup',
          title: 'Test Group',
        },
        from: {
          id: 1111111,
          is_bot: false,
          first_name: 'Test',
          username: 'Test',
        },
        date: 1441645552,
        old_chat_member: {
          user: {
            id: 2222222,
            is_bot: false,
            first_name: 'User',
            username: 'user',
          },
          status: 'member',
        },
        new_chat_member: {
          user: {
            id: 2222222,
            is_bot: false,
            first_name: 'User',
            username: 'user',
          },
          status: 'administrator',
          can_be_edited: false,
          can_manage_chat: true,
          can_change_info: true,
          can_delete_messages: true,
          can_invite_users: true,
          can_restrict_members: true,
          can_pin_messages: true,
          can_promote_members: false,
        },
      },
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.ChatMemberUpdatedActionEvent);
    expect(event.kind).toBe('action');
    expect(event.type).toBe('chat_member_updated');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });

  it('UnknownEvent', () => {
    const payload: TelegramRawEvent = {
      update_id: 10030,
      // No known event type properties
    };

    const event = eventFactory(BOT_ID, payload);

    expect(event).toBeInstanceOf(Events.UnknownEvent);
    expect(event.kind).toBe('unknown');
    expect(event.type).toBe('unknown');
    expect(event.botId).toBe(BOT_ID);
    expect(event.payload).toBe(payload);
  });
});
