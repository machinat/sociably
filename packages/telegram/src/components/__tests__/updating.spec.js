import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils/isX';
import Renderer from '@machinat/core/renderer';
import { InlineKeyboard, CallbackButton } from '../replyMarkup';
import { Animation, Audio, Document, Video, Photo } from '../media';
import {
  EditText,
  EditCaption,
  EditMedia,
  StopPoll,
  DeleteMessage,
} from '../updating';

const renderer = new Renderer('telegram', (node, path) => [
  {
    type: 'text',
    node,
    path,
    value: `<${node.type}>${node.props.children}</${node.type}>`,
  },
]);

describe.each([EditText, EditCaption, EditMedia, StopPoll, DeleteMessage])(
  '%p',
  (Updating) => {
    it('is valid unit Component', () => {
      expect(typeof Updating).toBe('function');
      expect(isNativeType(<Updating />)).toBe(true);
      expect(Updating.$$platform).toBe('telegram');
    });
  }
);

test('EditText match snapshot', async () => {
  await expect(
    renderer.render(
      <EditText messageId={123}>
        <b>foo</b>
      </EditText>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <EditText
                messageId={123}
              >
                <b>
                  foo
                </b>
              </EditText>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "editMessageText",
                "parameters": Object {
                  "disable_web_page_preview": undefined,
                  "inline_message_id": undefined,
                  "message_id": 123,
                  "parse_mode": "HTML",
                  "reply_markup": undefined,
                  "text": "<b>foo</b>",
                },
                "toDirectInstance": false,
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <EditText messageId={123} parseMode="None">
        foo
      </EditText>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <EditText
                messageId={123}
                parseMode="None"
              >
                foo
              </EditText>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "editMessageText",
                "parameters": Object {
                  "disable_web_page_preview": undefined,
                  "inline_message_id": undefined,
                  "message_id": 123,
                  "parse_mode": undefined,
                  "reply_markup": undefined,
                  "text": "foo",
                },
                "toDirectInstance": false,
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <EditText
        inlineMessageId="123456"
        parseMode="MarkdownV2"
        disableWebPagePreview
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Bar" data="__BAR__" />
          </InlineKeyboard>
        }
      >
        *foo*
      </EditText>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <EditText
                disableWebPagePreview={true}
                inlineMessageId="123456"
                parseMode="MarkdownV2"
                replyMarkup={
                  <InlineKeyboard>
                    <CallbackButton
                      data="__BAR__"
                      text="Bar"
                    />
                  </InlineKeyboard>
                }
              >
                *foo*
              </EditText>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "editMessageText",
                "parameters": Object {
                  "disable_web_page_preview": true,
                  "inline_message_id": "123456",
                  "message_id": undefined,
                  "parse_mode": "MarkdownV2",
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__BAR__",
                        "text": "Bar",
                      },
                    ],
                  },
                  "text": "*foo*",
                },
                "toDirectInstance": true,
              },
            },
          ]
        `);
});

test('EditCaption match snapshot', async () => {
  await expect(
    renderer.render(
      <EditCaption messageId={123}>
        <b>foo</b>
      </EditCaption>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <EditCaption
                messageId={123}
              >
                <b>
                  foo
                </b>
              </EditCaption>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "editMessageCaption",
                "parameters": Object {
                  "caption": "<b>foo</b>",
                  "inline_message_id": undefined,
                  "message_id": 123,
                  "parse_mode": "HTML",
                  "reply_markup": undefined,
                },
                "toDirectInstance": false,
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <EditCaption messageId={123} parseMode="None">
        foo
      </EditCaption>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <EditCaption
                messageId={123}
                parseMode="None"
              >
                foo
              </EditCaption>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "editMessageCaption",
                "parameters": Object {
                  "caption": "foo",
                  "inline_message_id": undefined,
                  "message_id": 123,
                  "parse_mode": undefined,
                  "reply_markup": undefined,
                },
                "toDirectInstance": false,
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <EditCaption
        inlineMessageId="123456"
        parseMode="MarkdownV2"
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Bar" data="__BAR__" />
          </InlineKeyboard>
        }
      >
        *foo*
      </EditCaption>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <EditCaption
                inlineMessageId="123456"
                parseMode="MarkdownV2"
                replyMarkup={
                  <InlineKeyboard>
                    <CallbackButton
                      data="__BAR__"
                      text="Bar"
                    />
                  </InlineKeyboard>
                }
              >
                *foo*
              </EditCaption>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "editMessageCaption",
                "parameters": Object {
                  "caption": "*foo*",
                  "inline_message_id": "123456",
                  "message_id": undefined,
                  "parse_mode": "MarkdownV2",
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__BAR__",
                        "text": "Bar",
                      },
                    ],
                  },
                },
                "toDirectInstance": true,
              },
            },
          ]
        `);
});

test('EditMedia match snapshot', async () => {
  await expect(
    renderer.render(
      <EditMedia messageId={123}>
        <Animation fileId="123456" duration={100} width={1920} height={1080} />
      </EditMedia>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <EditMedia
                messageId={123}
              >
                <Animation
                  duration={100}
                  fileId="123456"
                  height={1080}
                  width={1920}
                />
              </EditMedia>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "editMessageMedia",
                "parameters": Object {
                  "inline_message_id": undefined,
                  "media": Object {
                    "caption": undefined,
                    "duration": 100,
                    "height": 1080,
                    "media": "123456",
                    "parse_mode": "HTML",
                    "thumb": undefined,
                    "type": "animation",
                    "width": 1920,
                  },
                  "message_id": 123,
                  "reply_markup": undefined,
                },
                "toDirectInstance": false,
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <EditMedia messageId={123}>
        <Audio
          url="http://foo.bar/baz.mp3"
          caption="Plain Text Caption"
          parseMode="None"
          duration={100}
          performer="John Doe"
          title="Foo"
        />
      </EditMedia>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <EditMedia
                messageId={123}
              >
                <Audio
                  caption="Plain Text Caption"
                  duration={100}
                  parseMode="None"
                  performer="John Doe"
                  title="Foo"
                  url="http://foo.bar/baz.mp3"
                />
              </EditMedia>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "editMessageMedia",
                "parameters": Object {
                  "inline_message_id": undefined,
                  "media": Object {
                    "caption": "Plain Text Caption",
                    "duration": 100,
                    "media": "http://foo.bar/baz.mp3",
                    "parse_mode": undefined,
                    "performer": "John Doe",
                    "thumb": undefined,
                    "title": "Foo",
                    "type": "audio",
                  },
                  "message_id": 123,
                  "reply_markup": undefined,
                },
                "toDirectInstance": false,
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <EditMedia messageId={123}>
        <Document
          fileData="__DATA__"
          fileInfo={{ fileName: 'baz.txt' }}
          fileAssetTag="my_doc"
          caption={<b>Important Document</b>}
        />
      </EditMedia>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <EditMedia
                messageId={123}
              >
                <Document
                  caption={
                    <b>
                      Important Document
                    </b>
                  }
                  fileAssetTag="my_doc"
                  fileData="__DATA__"
                  fileInfo={
                    Object {
                      "fileName": "baz.txt",
                    }
                  }
                />
              </EditMedia>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "editMessageMedia",
                "parameters": Object {
                  "inline_message_id": undefined,
                  "media": Object {
                    "caption": "<b>Important Document</b>",
                    "media": "attach://document",
                    "parse_mode": "HTML",
                    "thumb": undefined,
                    "type": "document",
                  },
                  "message_id": 123,
                  "reply_markup": undefined,
                },
                "toDirectInstance": false,
                "uploadingFiles": Array [
                  Object {
                    "fieldName": "document",
                    "fileAssetTag": "my_doc",
                    "fileData": "__DATA__",
                    "fileInfo": Object {
                      "fileName": "baz.txt",
                    },
                  },
                ],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <EditMedia messageId={123}>
        <Video
          fileData="__DATA__"
          fileInfo={{ fileName: 'baz.mp4' }}
          fileAssetTag="my_video"
          parseMode="MarkdownV2"
          caption="__MyVideo__"
          thumbnailFileData="__THUMB_DATA__"
          thumbnailFileInfo={{ fileName: 'baz.jpg' }}
          duration={100}
          width={1920}
          height={1080}
          supportsStreaming
        />
      </EditMedia>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <EditMedia
                messageId={123}
              >
                <Video
                  caption="__MyVideo__"
                  duration={100}
                  fileAssetTag="my_video"
                  fileData="__DATA__"
                  fileInfo={
                    Object {
                      "fileName": "baz.mp4",
                    }
                  }
                  height={1080}
                  parseMode="MarkdownV2"
                  supportsStreaming={true}
                  thumbnailFileData="__THUMB_DATA__"
                  thumbnailFileInfo={
                    Object {
                      "fileName": "baz.jpg",
                    }
                  }
                  width={1920}
                />
              </EditMedia>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "editMessageMedia",
                "parameters": Object {
                  "inline_message_id": undefined,
                  "media": Object {
                    "caption": "__MyVideo__",
                    "duration": 100,
                    "height": 1080,
                    "media": "attach://video",
                    "parse_mode": "MarkdownV2",
                    "supports_streaming": true,
                    "thumb": "attach://thumb",
                    "type": "video",
                    "width": 1920,
                  },
                  "message_id": 123,
                  "reply_markup": undefined,
                },
                "toDirectInstance": false,
                "uploadingFiles": Array [
                  Object {
                    "fieldName": "video",
                    "fileAssetTag": "my_video",
                    "fileData": "__DATA__",
                    "fileInfo": Object {
                      "fileName": "baz.mp4",
                    },
                  },
                  Object {
                    "fieldName": "thumb",
                    "fileAssetTag": undefined,
                    "fileData": "__THUMB_DATA__",
                    "fileInfo": Object {
                      "fileName": "baz.jpg",
                    },
                  },
                ],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <EditMedia
        inlineMessageId="123456"
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Bar" data="__BAR__" />
          </InlineKeyboard>
        }
      >
        <Photo
          fileData="__DATA__"
          fileInfo={{ fileName: 'baz.jpg' }}
          fileAssetTag="my_photo"
        />
      </EditMedia>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <EditMedia
                inlineMessageId="123456"
                replyMarkup={
                  <InlineKeyboard>
                    <CallbackButton
                      data="__BAR__"
                      text="Bar"
                    />
                  </InlineKeyboard>
                }
              >
                <Photo
                  fileAssetTag="my_photo"
                  fileData="__DATA__"
                  fileInfo={
                    Object {
                      "fileName": "baz.jpg",
                    }
                  }
                />
              </EditMedia>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "editMessageMedia",
                "parameters": Object {
                  "inline_message_id": "123456",
                  "media": Object {
                    "caption": undefined,
                    "media": "attach://photo",
                    "parse_mode": "HTML",
                    "type": "photo",
                  },
                  "message_id": undefined,
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__BAR__",
                        "text": "Bar",
                      },
                    ],
                  },
                },
                "toDirectInstance": true,
                "uploadingFiles": Array [
                  Object {
                    "fieldName": "photo",
                    "fileAssetTag": "my_photo",
                    "fileData": "__DATA__",
                    "fileInfo": Object {
                      "fileName": "baz.jpg",
                    },
                  },
                ],
              },
            },
          ]
        `);
});

test('StopPoll match snapshot', async () => {
  await expect(renderer.render(<StopPoll messageId={123} />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <StopPoll
                messageId={123}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "stopPoll",
                "parameters": Object {
                  "message_id": 123,
                  "reply_markup": undefined,
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <StopPoll
        messageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Noooo" data="__TOO_LATE__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <StopPoll
                messageId={123}
                replyMarkup={
                  <InlineKeyboard>
                    <CallbackButton
                      data="__TOO_LATE__"
                      text="Noooo"
                    />
                  </InlineKeyboard>
                }
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "stopPoll",
                "parameters": Object {
                  "message_id": 123,
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__TOO_LATE__",
                        "text": "Noooo",
                      },
                    ],
                  },
                },
              },
            },
          ]
        `);
});

test('DeleteMessage match snapshot', async () => {
  await expect(renderer.render(<DeleteMessage messageId={123} />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <DeleteMessage
                messageId={123}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "deleteMessage",
                "parameters": Object {
                  "message_id": 123,
                },
              },
            },
          ]
        `);
});
