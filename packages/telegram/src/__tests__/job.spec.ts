import { TelegramChat } from '../channel';
import { createChatJob, createDirectInstanceJobs } from '../job';

describe('createChatJob(channel, segments)', () => {
  const chat = new TelegramChat(12345, { id: 67890, type: 'private' });

  it('create jobs from segments', () => {
    expect(
      createChatJob(chat, [
        {
          type: 'unit',
          node: {} as any,
          path: '$',
          value: {
            method: 'sendMesage',
            parameters: { text: 'foo' },
          },
        },
        {
          type: 'unit',
          node: {} as any,
          path: '$',
          value: {
            method: 'sendPhoto',
            parameters: { caption: 'bar', photo: undefined },
            uploadingFiles: [
              {
                fieldName: 'photo',
                fileData: Buffer.from('BAR'),
                fileInfo: { filename: 'bar.jpg' },
                fileAssetTag: 'MyBar',
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
          "executionKey": "telegram.12345.67890",
          "method": "sendMesage",
          "parameters": Object {
            "chat_id": 67890,
            "text": "foo",
          },
          "uploadingFiles": null,
        },
        Object {
          "executionKey": "telegram.12345.67890",
          "method": "sendPhoto",
          "parameters": Object {
            "caption": "bar",
            "chat_id": 67890,
            "photo": undefined,
          },
          "uploadingFiles": Array [
            Object {
              "fieldName": "photo",
              "fileAssetTag": "MyBar",
              "fileData": Object {
                "data": Array [
                  66,
                  65,
                  82,
                ],
                "type": "Buffer",
              },
              "fileInfo": Object {
                "filename": "bar.jpg",
              },
            },
          ],
        },
        Object {
          "executionKey": "telegram.12345.67890",
          "method": "sendMessage",
          "parameters": Object {
            "chat_id": 67890,
            "parse_mode": "HTML",
            "text": "baz",
          },
          "uploadingFiles": null,
        },
      ]
    `);
  });
});

describe('createDirectInstanceJobs(segments)', () => {
  it('create jobs from segments', () => {
    expect(
      createDirectInstanceJobs(null, [
        {
          type: 'unit',
          node: {} as any,
          path: '$',
          value: {
            method: 'answerCallbackQuery',
            toDirectInstance: true,
            parameters: {
              callback_query_id: '123456',
            },
          },
        },
        {
          type: 'unit',
          node: {} as any,
          path: '$',
          value: {
            method: 'editMessageText',
            toDirectInstance: true,
            parameters: {
              text: 'foo',
              inline_message_id: 123,
            },
          },
        },
        {
          type: 'unit',
          node: {} as any,
          path: '$',
          value: {
            method: 'editMessageMedia',
            toDirectInstance: true,
            parameters: {
              inline_message_id: 123,
              media: {
                type: 'photo',
                media: 'attach://photo',
              },
            },
            uploadingFiles: [
              {
                fieldName: 'photo',
                fileData: Buffer.from('BAR'),
                fileInfo: { filename: 'bar.jpg' },
                fileAssetTag: 'MyBar',
              },
            ],
          },
        },
      ])
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "executionKey": undefined,
          "method": "answerCallbackQuery",
          "parameters": Object {
            "callback_query_id": "123456",
          },
          "uploadingFiles": null,
        },
        Object {
          "executionKey": undefined,
          "method": "editMessageText",
          "parameters": Object {
            "inline_message_id": 123,
            "text": "foo",
          },
          "uploadingFiles": null,
        },
        Object {
          "executionKey": undefined,
          "method": "editMessageMedia",
          "parameters": Object {
            "inline_message_id": 123,
            "media": Object {
              "media": "attach://photo",
              "type": "photo",
            },
          },
          "uploadingFiles": Array [
            Object {
              "fieldName": "photo",
              "fileAssetTag": "MyBar",
              "fileData": Object {
                "data": Array [
                  66,
                  65,
                  82,
                ],
                "type": "Buffer",
              },
              "fileInfo": Object {
                "filename": "bar.jpg",
              },
            },
          ],
        },
      ]
    `);
  });

  it('throw if text segment received', () => {
    expect(() =>
      createDirectInstanceJobs(null, [
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
      createDirectInstanceJobs(null, [
        {
          type: 'unit',
          node: '__ELEMENT__',
          path: '$',
          value: {
            method: 'editMessageText',
            parameters: {
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
      createDirectInstanceJobs(null, [
        {
          type: 'unit',
          node: '__ELEMENT__',
          path: '$',
          value: {
            method: 'sendMessage',
            parameters: {
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
