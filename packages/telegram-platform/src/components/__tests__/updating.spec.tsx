import Sociably, { SociablyNode } from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import { InlineKeyboard, CallbackButton } from '../replyMarkup.js';
import { Animation, Audio, Document, Video, Photo } from '../media.js';
import {
  EditText,
  EditCaption,
  EditMedia,
  StopPoll,
  DeleteMessage,
} from '../updating.js';

const renderer = new Renderer('telegram', async (node, path) => [
  {
    type: 'text',
    node,
    path,
    value: `<${node.type}>${node.props.children}</${node.type}>`,
  },
]);
const render = async (node: SociablyNode) => renderer.render(node, null, null);

describe.each([EditText, EditCaption, EditMedia, StopPoll, DeleteMessage])(
  '%p',
  (Updating) => {
    it('is valid unit Component', () => {
      expect(isNativeType(<Updating> </Updating>)).toBe(true);
      expect(Updating.$$platform).toBe('telegram');
    });
  },
);

test('EditText match snapshot', async () => {
  await expect(
    render(
      <EditText messageId={123}>
        <b>foo</b>
      </EditText>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <EditText
          messageId={123}
        >
          <b>
            foo
          </b>
        </EditText>,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "editMessageText",
          "params": {
            "disable_web_page_preview": undefined,
            "inline_message_id": undefined,
            "message_id": 123,
            "parse_mode": "HTML",
            "reply_markup": undefined,
            "text": "<b>foo</b>",
          },
          "toNonChatTarget": false,
        },
      },
    ]
  `);
  await expect(
    render(
      <EditText messageId={123} parseMode="None">
        foo
      </EditText>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <EditText
          messageId={123}
          parseMode="None"
        >
          foo
        </EditText>,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "editMessageText",
          "params": {
            "disable_web_page_preview": undefined,
            "inline_message_id": undefined,
            "message_id": 123,
            "parse_mode": undefined,
            "reply_markup": undefined,
            "text": "foo",
          },
          "toNonChatTarget": false,
        },
      },
    ]
  `);
  await expect(
    render(
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
      </EditText>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
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
        "value": {
          "method": "editMessageText",
          "params": {
            "disable_web_page_preview": true,
            "inline_message_id": "123456",
            "message_id": undefined,
            "parse_mode": "MarkdownV2",
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "callback_data": "__BAR__",
                    "text": "Bar",
                  },
                ],
              ],
            },
            "text": "*foo*",
          },
          "toNonChatTarget": true,
        },
      },
    ]
  `);
});

test('EditCaption match snapshot', async () => {
  await expect(
    render(
      <EditCaption messageId={123}>
        <b>foo</b>
      </EditCaption>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <EditCaption
          messageId={123}
        >
          <b>
            foo
          </b>
        </EditCaption>,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "editMessageCaption",
          "params": {
            "caption": "<b>foo</b>",
            "inline_message_id": undefined,
            "message_id": 123,
            "parse_mode": "HTML",
            "reply_markup": undefined,
          },
          "toNonChatTarget": false,
        },
      },
    ]
  `);
  await expect(
    render(
      <EditCaption messageId={123} parseMode="None">
        foo
      </EditCaption>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <EditCaption
          messageId={123}
          parseMode="None"
        >
          foo
        </EditCaption>,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "editMessageCaption",
          "params": {
            "caption": "foo",
            "inline_message_id": undefined,
            "message_id": 123,
            "parse_mode": undefined,
            "reply_markup": undefined,
          },
          "toNonChatTarget": false,
        },
      },
    ]
  `);
  await expect(
    render(
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
      </EditCaption>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
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
        "value": {
          "method": "editMessageCaption",
          "params": {
            "caption": "*foo*",
            "inline_message_id": "123456",
            "message_id": undefined,
            "parse_mode": "MarkdownV2",
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "callback_data": "__BAR__",
                    "text": "Bar",
                  },
                ],
              ],
            },
          },
          "toNonChatTarget": true,
        },
      },
    ]
  `);
});

test('EditMedia match snapshot', async () => {
  await expect(
    render(
      <EditMedia messageId={123}>
        <Animation fileId="123456" duration={100} width={1920} height={1080} />
      </EditMedia>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
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
        "value": {
          "files": [],
          "method": "editMessageMedia",
          "params": {
            "inline_message_id": undefined,
            "media": {
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
          "toNonChatTarget": false,
        },
      },
    ]
  `);
  await expect(
    render(
      <EditMedia messageId={123}>
        <Audio
          url="http://foo.bar/baz.mp3"
          caption="Plain Text Caption"
          parseMode="None"
          duration={100}
          performer="John Doe"
          title="Foo"
        />
      </EditMedia>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
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
        "value": {
          "files": [],
          "method": "editMessageMedia",
          "params": {
            "inline_message_id": undefined,
            "media": {
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
          "toNonChatTarget": false,
        },
      },
    ]
  `);
  await expect(
    render(
      <EditMedia messageId={123}>
        <Document
          file={{
            data: '__DATA__',
            fileName: 'baz.txt',
          }}
          assetTag="my_doc"
          caption={<b>Important Document</b>}
        />
      </EditMedia>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <EditMedia
          messageId={123}
        >
          <Document
            assetTag="my_doc"
            caption={
              <b>
                Important Document
              </b>
            }
            file={
              {
                "data": "__DATA__",
                "fileName": "baz.txt",
              }
            }
          />
        </EditMedia>,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [
            {
              "assetTag": "my_doc",
              "fieldName": "document",
              "source": {
                "data": "__DATA__",
                "fileName": "baz.txt",
              },
            },
          ],
          "method": "editMessageMedia",
          "params": {
            "inline_message_id": undefined,
            "media": {
              "caption": "<b>Important Document</b>",
              "media": "attach://document",
              "parse_mode": "HTML",
              "thumb": undefined,
              "type": "document",
            },
            "message_id": 123,
            "reply_markup": undefined,
          },
          "toNonChatTarget": false,
        },
      },
    ]
  `);
  await expect(
    render(
      <EditMedia messageId={123}>
        <Video
          file={{
            data: '__DATA__',
            fileName: 'baz.mp4',
          }}
          assetTag="my_video"
          parseMode="MarkdownV2"
          caption="__MyVideo__"
          thumbnailFile={{
            data: '__THUMB_DATA__',
            fileName: 'baz.jpg',
          }}
          duration={100}
          width={1920}
          height={1080}
          supportsStreaming
        />
      </EditMedia>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <EditMedia
          messageId={123}
        >
          <Video
            assetTag="my_video"
            caption="__MyVideo__"
            duration={100}
            file={
              {
                "data": "__DATA__",
                "fileName": "baz.mp4",
              }
            }
            height={1080}
            parseMode="MarkdownV2"
            supportsStreaming={true}
            thumbnailFile={
              {
                "data": "__THUMB_DATA__",
                "fileName": "baz.jpg",
              }
            }
            width={1920}
          />
        </EditMedia>,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [
            {
              "assetTag": "my_video",
              "fieldName": "video",
              "source": {
                "data": "__DATA__",
                "fileName": "baz.mp4",
              },
            },
            {
              "assetTag": undefined,
              "fieldName": "thumb",
              "source": {
                "data": "__THUMB_DATA__",
                "fileName": "baz.jpg",
              },
            },
          ],
          "method": "editMessageMedia",
          "params": {
            "inline_message_id": undefined,
            "media": {
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
          "toNonChatTarget": false,
        },
      },
    ]
  `);
  await expect(
    render(
      <EditMedia
        inlineMessageId="123456"
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Bar" data="__BAR__" />
          </InlineKeyboard>
        }
      >
        <Photo
          file={{
            data: '__DATA__',
            fileName: 'baz.jpg',
          }}
          assetTag="my_photo"
        />
      </EditMedia>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
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
            assetTag="my_photo"
            file={
              {
                "data": "__DATA__",
                "fileName": "baz.jpg",
              }
            }
          />
        </EditMedia>,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [
            {
              "assetTag": "my_photo",
              "fieldName": "photo",
              "source": {
                "data": "__DATA__",
                "fileName": "baz.jpg",
              },
            },
          ],
          "method": "editMessageMedia",
          "params": {
            "inline_message_id": "123456",
            "media": {
              "caption": undefined,
              "media": "attach://photo",
              "parse_mode": "HTML",
              "type": "photo",
            },
            "message_id": undefined,
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "callback_data": "__BAR__",
                    "text": "Bar",
                  },
                ],
              ],
            },
          },
          "toNonChatTarget": true,
        },
      },
    ]
  `);
});

test('StopPoll match snapshot', async () => {
  await expect(render(<StopPoll messageId={123} />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <StopPoll
          messageId={123}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "stopPoll",
          "params": {
            "message_id": 123,
            "reply_markup": undefined,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <StopPoll
        messageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Noooo" data="__TOO_LATE__" />
          </InlineKeyboard>
        }
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
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
        "value": {
          "method": "stopPoll",
          "params": {
            "message_id": 123,
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "callback_data": "__TOO_LATE__",
                    "text": "Noooo",
                  },
                ],
              ],
            },
          },
        },
      },
    ]
  `);
});

test('DeleteMessage match snapshot', async () => {
  await expect(render(<DeleteMessage messageId={123} />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <DeleteMessage
          messageId={123}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "deleteMessage",
          "params": {
            "message_id": 123,
          },
        },
      },
    ]
  `);
});
