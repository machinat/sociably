import { TelegramChat } from '../channel';
import { createChatJob, createUpdatingInlineMessageJobs } from '../job';

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

describe('createUpdatingInlineMessageJobs(segments)', () => {
  it('create jobs from segments', () => {
    expect(
      createUpdatingInlineMessageJobs(null, [
        {
          type: 'unit',
          node: {} as any,
          path: '$',
          value: {
            method: 'editMessageText',
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
      createUpdatingInlineMessageJobs(null, [
        {
          type: 'text',
          node: 'foo',
          path: '$',
          value: 'foo',
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"normal text not alowed when updating messages, use <EditText/>"`
    );
  });

  it('throw if inline_message_id missing in segment value', () => {
    expect(() =>
      createUpdatingInlineMessageJobs(null, [
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
      `"no inlineMessageId provided on \\"__ELEMENT__\\""`
    );
  });
});
