import TelegramChat from '../Chat';
import TelegramUser from '../User';
import { createChatJob, createBotScopeJobs } from '../job';

describe('createChatJob(thread, segments)', () => {
  const chat = new TelegramChat(12345, 67890);

  it('create jobs from segments', () => {
    expect(
      createChatJob(chat, [
        {
          type: 'unit',
          node: null,
          path: '$',
          value: {
            method: 'sendMesage',
            params: { text: 'foo' },
          },
        },
        {
          type: 'unit',
          node: null,
          path: '$',
          value: {
            method: 'sendPhoto',
            params: { caption: 'bar', photo: undefined },
            files: [
              {
                fieldName: 'photo',
                data: Buffer.from('BAR'),
                info: { filename: 'bar.jpg' },
                assetTag: 'MyBar',
              },
            ],
          },
        },
        {
          type: 'text',
          node: 'baz',
          path: '$',
          value: 'baz',
        },
      ])
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "botId": 12345,
          "files": undefined,
          "key": "tg.12345.67890",
          "method": "sendMesage",
          "params": Object {
            "chat_id": 67890,
            "text": "foo",
          },
        },
        Object {
          "botId": 12345,
          "files": Array [
            Object {
              "assetTag": "MyBar",
              "data": Object {
                "data": Array [
                  66,
                  65,
                  82,
                ],
                "type": "Buffer",
              },
              "fieldName": "photo",
              "info": Object {
                "filename": "bar.jpg",
              },
            },
          ],
          "key": "tg.12345.67890",
          "method": "sendPhoto",
          "params": Object {
            "caption": "bar",
            "chat_id": 67890,
            "photo": undefined,
          },
        },
        Object {
          "botId": 12345,
          "files": Array [],
          "key": "tg.12345.67890",
          "method": "sendMessage",
          "params": Object {
            "chat_id": 67890,
            "parse_mode": "HTML",
            "text": "baz",
          },
        },
      ]
    `);
  });
});

describe('createBotScopeJobs(action, segments)', () => {
  it('create jobs from segments', () => {
    expect(
      createBotScopeJobs(new TelegramUser(12345, true), [
        {
          type: 'unit',
          node: null,
          path: '$',
          value: {
            method: 'answerCallbackQuery',
            toNonChatTarget: true,
            params: {
              callback_query_id: '_CALLBACK_QUERY_ID_',
            },
          },
        },
        {
          type: 'unit',
          node: null,
          path: '$',
          value: {
            method: 'editMessageText',
            toNonChatTarget: true,
            params: {
              text: 'foo',
              inline_message_id: 123,
            },
          },
        },
        {
          type: 'unit',
          node: null,
          path: '$',
          value: {
            method: 'editMessageMedia',
            toNonChatTarget: true,
            params: {
              inline_message_id: 123,
              media: {
                type: 'photo',
                media: 'attach://photo',
              },
            },
            files: [
              {
                fieldName: 'photo',
                data: Buffer.from('BAR'),
                info: { filename: 'bar.jpg' },
                assetTag: 'MyBar',
              },
            ],
          },
        },
      ])
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "botId": 12345,
          "files": undefined,
          "key": undefined,
          "method": "answerCallbackQuery",
          "params": Object {
            "callback_query_id": "_CALLBACK_QUERY_ID_",
          },
        },
        Object {
          "botId": 12345,
          "files": undefined,
          "key": undefined,
          "method": "editMessageText",
          "params": Object {
            "inline_message_id": 123,
            "text": "foo",
          },
        },
        Object {
          "botId": 12345,
          "files": Array [
            Object {
              "assetTag": "MyBar",
              "data": Object {
                "data": Array [
                  66,
                  65,
                  82,
                ],
                "type": "Buffer",
              },
              "fieldName": "photo",
              "info": Object {
                "filename": "bar.jpg",
              },
            },
          ],
          "key": undefined,
          "method": "editMessageMedia",
          "params": Object {
            "inline_message_id": 123,
            "media": Object {
              "media": "attach://photo",
              "type": "photo",
            },
          },
        },
      ]
    `);
  });

  it('throw if text segment received', () => {
    expect(() =>
      createBotScopeJobs(new TelegramUser(12345, true), [
        {
          type: 'text',
          node: 'foo',
          path: '$',
          value: 'foo',
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"text is invalid to be rendered without target chat"`
    );
  });

  it('throw if inline_message_id missing when editing inline message', () => {
    expect(() =>
      createBotScopeJobs(new TelegramUser(12345, true), [
        {
          type: 'unit',
          node: '__ELEMENT__',
          path: '$',
          value: {
            method: 'editMessageText',
            params: {
              text: 'foo',
            },
          },
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"inlineMessageId is required to edit an inline message"`
    );
  });

  it('throw if the content is not to be rendered without target chat', () => {
    expect(() =>
      createBotScopeJobs(new TelegramUser(12345, true), [
        {
          type: 'unit',
          node: '__ELEMENT__',
          path: '$',
          value: {
            method: 'sendMessage',
            params: {
              text: 'foo',
            },
          },
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"\\"__ELEMENT__\\" is invalid to be rendered without target chat"`
    );
  });
});
