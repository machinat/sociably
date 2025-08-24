import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import { InlineKeyboard, CallbackButton } from '../replyMarkup.js';
import {
  Photo,
  Audio,
  Document,
  Video,
  Animation,
  Voice,
  VideoNote,
  MediaGroup,
  Sticker,
} from '../media.js';

const renderer = new Renderer('telegram', async (node, path) => [
  {
    type: 'text',
    node,
    path,
    value: `<${node.type}>${node.props.children}</${node.type}>`,
  },
]);

const render = (node) => renderer.render(node, null, null);

describe.each([
  Photo,
  Audio,
  Document,
  Video,
  Animation,
  Voice,
  VideoNote,
  MediaGroup,
  Sticker,
])('%p', (LocationAction) => {
  it('is valid unit Component', () => {
    expect(isNativeType(<LocationAction />)).toBe(true);
    expect(LocationAction.$$platform).toBe('telegram');
  });
});

test('Photo match snapshot', async () => {
  await expect(render(<Photo fileId="12345" caption={<b>My Photo</b>} />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Photo
          caption={
            <b>
              My Photo
            </b>
          }
          fileId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": undefined,
          "method": "sendPhoto",
          "params": {
            "caption": "<b>My Photo</b>",
            "disable_notification": undefined,
            "parse_mode": "HTML",
            "photo": "12345",
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <Photo
        url="http://foo.bar/baz.jpg"
        caption="PlainTextCaption"
        parseMode="None"
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Photo
          caption="PlainTextCaption"
          parseMode="None"
          url="http://foo.bar/baz.jpg"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": undefined,
          "method": "sendPhoto",
          "params": {
            "caption": "PlainTextCaption",
            "disable_notification": undefined,
            "parse_mode": undefined,
            "photo": "http://foo.bar/baz.jpg",
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <Photo
        file={{
          data: '__DATA__',
          fileName: 'baz.jpg',
        }}
        assetTag="my_photo"
        parseMode="MarkdownV2"
        caption="__MyPhoto__"
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Like" data="__LIKE__" />
          </InlineKeyboard>
        }
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Photo
          assetTag="my_photo"
          caption="__MyPhoto__"
          disableNotification={true}
          file={
            {
              "data": "__DATA__",
              "fileName": "baz.jpg",
            }
          }
          parseMode="MarkdownV2"
          replyMarkup={
            <InlineKeyboard>
              <CallbackButton
                data="__LIKE__"
                text="Like"
              />
            </InlineKeyboard>
          }
          replyToMessageId={123}
        />,
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
          "method": "sendPhoto",
          "params": {
            "caption": "__MyPhoto__",
            "disable_notification": true,
            "parse_mode": "MarkdownV2",
            "photo": undefined,
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "callback_data": "__LIKE__",
                    "text": "Like",
                  },
                ],
              ],
            },
            "reply_to_message_id": 123,
          },
        },
      },
    ]
  `);
});

test('Animation match snapshot', async () => {
  await expect(
    render(<Animation fileId="12345" caption={<b>My Animation</b>} />),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Animation
          caption={
            <b>
              My Animation
            </b>
          }
          fileId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [],
          "method": "sendAnimation",
          "params": {
            "animation": "12345",
            "caption": "<b>My Animation</b>",
            "disable_notification": undefined,
            "duration": undefined,
            "height": undefined,
            "parse_mode": "HTML",
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
            "width": undefined,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <Animation
        url="http://foo.bar/baz.gif"
        caption="PlainTextCaption"
        parseMode="None"
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Animation
          caption="PlainTextCaption"
          parseMode="None"
          url="http://foo.bar/baz.gif"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [],
          "method": "sendAnimation",
          "params": {
            "animation": "http://foo.bar/baz.gif",
            "caption": "PlainTextCaption",
            "disable_notification": undefined,
            "duration": undefined,
            "height": undefined,
            "parse_mode": undefined,
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
            "width": undefined,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <Animation
        file={{
          data: '__DATA__',
          fileName: 'baz.gif',
        }}
        assetTag="my_animate"
        parseMode="MarkdownV2"
        caption="__MyAnimation__"
        thumbnailFile={{
          data: '__THUMB_DATA__',
          fileName: 'baz.jpg',
        }}
        duration={100}
        width={1920}
        height={1080}
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Like" data="__LIKE__" />
          </InlineKeyboard>
        }
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Animation
          assetTag="my_animate"
          caption="__MyAnimation__"
          disableNotification={true}
          duration={100}
          file={
            {
              "data": "__DATA__",
              "fileName": "baz.gif",
            }
          }
          height={1080}
          parseMode="MarkdownV2"
          replyMarkup={
            <InlineKeyboard>
              <CallbackButton
                data="__LIKE__"
                text="Like"
              />
            </InlineKeyboard>
          }
          replyToMessageId={123}
          thumbnailFile={
            {
              "data": "__THUMB_DATA__",
              "fileName": "baz.jpg",
            }
          }
          width={1920}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [
            {
              "assetTag": "my_animate",
              "fieldName": "animation",
              "source": {
                "data": "__DATA__",
                "fileName": "baz.gif",
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
          "method": "sendAnimation",
          "params": {
            "animation": undefined,
            "caption": "__MyAnimation__",
            "disable_notification": true,
            "duration": 100,
            "height": 1080,
            "parse_mode": "MarkdownV2",
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "callback_data": "__LIKE__",
                    "text": "Like",
                  },
                ],
              ],
            },
            "reply_to_message_id": 123,
            "width": 1920,
          },
        },
      },
    ]
  `);
});

test('Audio match snapshot', async () => {
  await expect(render(<Audio fileId="12345" caption={<b>My Audio</b>} />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Audio
          caption={
            <b>
              My Audio
            </b>
          }
          fileId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [],
          "method": "sendAudio",
          "params": {
            "audio": "12345",
            "caption": "<b>My Audio</b>",
            "disable_notification": undefined,
            "duration": undefined,
            "parse_mode": "HTML",
            "performer": undefined,
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
            "title": undefined,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <Audio
        url="http://foo.bar/baz.mp3"
        caption="PlainTextCaption"
        parseMode="None"
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Audio
          caption="PlainTextCaption"
          parseMode="None"
          url="http://foo.bar/baz.mp3"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [],
          "method": "sendAudio",
          "params": {
            "audio": "http://foo.bar/baz.mp3",
            "caption": "PlainTextCaption",
            "disable_notification": undefined,
            "duration": undefined,
            "parse_mode": undefined,
            "performer": undefined,
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
            "title": undefined,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <Audio
        file={{
          data: '__DATA__',
          fileName: 'baz.mp3',
        }}
        assetTag="my_audio"
        parseMode="MarkdownV2"
        caption="__MyAudio__"
        thumbnailFile={{
          data: '__THUMB_DATA__',
          fileName: 'baz.jpg',
        }}
        duration={100}
        performer="John Doe"
        title="Foo"
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Like" data="__LIKE__" />
          </InlineKeyboard>
        }
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Audio
          assetTag="my_audio"
          caption="__MyAudio__"
          disableNotification={true}
          duration={100}
          file={
            {
              "data": "__DATA__",
              "fileName": "baz.mp3",
            }
          }
          parseMode="MarkdownV2"
          performer="John Doe"
          replyMarkup={
            <InlineKeyboard>
              <CallbackButton
                data="__LIKE__"
                text="Like"
              />
            </InlineKeyboard>
          }
          replyToMessageId={123}
          thumbnailFile={
            {
              "data": "__THUMB_DATA__",
              "fileName": "baz.jpg",
            }
          }
          title="Foo"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [
            {
              "assetTag": "my_audio",
              "fieldName": "audio",
              "source": {
                "data": "__DATA__",
                "fileName": "baz.mp3",
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
          "method": "sendAudio",
          "params": {
            "audio": undefined,
            "caption": "__MyAudio__",
            "disable_notification": true,
            "duration": 100,
            "parse_mode": "MarkdownV2",
            "performer": "John Doe",
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "callback_data": "__LIKE__",
                    "text": "Like",
                  },
                ],
              ],
            },
            "reply_to_message_id": 123,
            "title": "Foo",
          },
        },
      },
    ]
  `);
});

test('Document match snapshot', async () => {
  await expect(render(<Document fileId="12345" caption={<b>My Document</b>} />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Document
          caption={
            <b>
              My Document
            </b>
          }
          fileId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [],
          "method": "sendDocument",
          "params": {
            "caption": "<b>My Document</b>",
            "disable_notification": undefined,
            "document": "12345",
            "parse_mode": "HTML",
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <Document
        url="http://foo.bar/baz.txt"
        caption="PlainTextCaption"
        parseMode="None"
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Document
          caption="PlainTextCaption"
          parseMode="None"
          url="http://foo.bar/baz.txt"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [],
          "method": "sendDocument",
          "params": {
            "caption": "PlainTextCaption",
            "disable_notification": undefined,
            "document": "http://foo.bar/baz.txt",
            "parse_mode": undefined,
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <Document
        file={{
          data: '__DATA__',
          fileName: 'baz.txt',
        }}
        assetTag="my_doc"
        parseMode="MarkdownV2"
        caption="__MyDocument__"
        thumbnailFile={{
          data: '__THUMB_DATA__',
          fileName: 'baz.jpg',
        }}
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Like" data="__LIKE__" />
          </InlineKeyboard>
        }
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Document
          assetTag="my_doc"
          caption="__MyDocument__"
          disableNotification={true}
          file={
            {
              "data": "__DATA__",
              "fileName": "baz.txt",
            }
          }
          parseMode="MarkdownV2"
          replyMarkup={
            <InlineKeyboard>
              <CallbackButton
                data="__LIKE__"
                text="Like"
              />
            </InlineKeyboard>
          }
          replyToMessageId={123}
          thumbnailFile={
            {
              "data": "__THUMB_DATA__",
              "fileName": "baz.jpg",
            }
          }
        />,
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
            {
              "assetTag": undefined,
              "fieldName": "thumb",
              "source": {
                "data": "__THUMB_DATA__",
                "fileName": "baz.jpg",
              },
            },
          ],
          "method": "sendDocument",
          "params": {
            "caption": "__MyDocument__",
            "disable_notification": true,
            "document": undefined,
            "parse_mode": "MarkdownV2",
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "callback_data": "__LIKE__",
                    "text": "Like",
                  },
                ],
              ],
            },
            "reply_to_message_id": 123,
          },
        },
      },
    ]
  `);
});

test('Video match snapshot', async () => {
  await expect(render(<Video fileId="12345" caption={<b>My Video</b>} />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Video
          caption={
            <b>
              My Video
            </b>
          }
          fileId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [],
          "method": "sendVideo",
          "params": {
            "caption": "<b>My Video</b>",
            "disable_notification": undefined,
            "duration": undefined,
            "height": undefined,
            "parse_mode": "HTML",
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
            "supports_streaming": undefined,
            "video": "12345",
            "width": undefined,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <Video
        url="http://foo.bar/baz.mp4"
        caption="PlainTextCaption"
        parseMode="None"
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Video
          caption="PlainTextCaption"
          parseMode="None"
          url="http://foo.bar/baz.mp4"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [],
          "method": "sendVideo",
          "params": {
            "caption": "PlainTextCaption",
            "disable_notification": undefined,
            "duration": undefined,
            "height": undefined,
            "parse_mode": undefined,
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
            "supports_streaming": undefined,
            "video": "http://foo.bar/baz.mp4",
            "width": undefined,
          },
        },
      },
    ]
  `);
  await expect(
    render(
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
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Like" data="__LIKE__" />
          </InlineKeyboard>
        }
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Video
          assetTag="my_video"
          caption="__MyVideo__"
          disableNotification={true}
          duration={100}
          file={
            {
              "data": "__DATA__",
              "fileName": "baz.mp4",
            }
          }
          height={1080}
          parseMode="MarkdownV2"
          replyMarkup={
            <InlineKeyboard>
              <CallbackButton
                data="__LIKE__"
                text="Like"
              />
            </InlineKeyboard>
          }
          replyToMessageId={123}
          supportsStreaming={true}
          thumbnailFile={
            {
              "data": "__THUMB_DATA__",
              "fileName": "baz.jpg",
            }
          }
          width={1920}
        />,
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
          "method": "sendVideo",
          "params": {
            "caption": "__MyVideo__",
            "disable_notification": true,
            "duration": 100,
            "height": 1080,
            "parse_mode": "MarkdownV2",
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "callback_data": "__LIKE__",
                    "text": "Like",
                  },
                ],
              ],
            },
            "reply_to_message_id": 123,
            "supports_streaming": true,
            "video": undefined,
            "width": 1920,
          },
        },
      },
    ]
  `);
});

test('Voice match snapshot', async () => {
  await expect(render(<Voice fileId="12345" caption={<b>My Voice</b>} />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Voice
          caption={
            <b>
              My Voice
            </b>
          }
          fileId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": undefined,
          "method": "sendVoice",
          "params": {
            "caption": "<b>My Voice</b>",
            "disable_notification": undefined,
            "duration": undefined,
            "parse_mode": "HTML",
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
            "voice": "12345",
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <Voice
        url="http://foo.bar/baz.wmv"
        caption="PlainTextCaption"
        parseMode="None"
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Voice
          caption="PlainTextCaption"
          parseMode="None"
          url="http://foo.bar/baz.wmv"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": undefined,
          "method": "sendVoice",
          "params": {
            "caption": "PlainTextCaption",
            "disable_notification": undefined,
            "duration": undefined,
            "parse_mode": undefined,
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
            "voice": "http://foo.bar/baz.wmv",
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <Voice
        file={{
          data: '__DATA__',
          fileName: 'baz.wmv',
        }}
        assetTag="my_voice"
        parseMode="MarkdownV2"
        caption="__MyVoice__"
        duration={100}
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Like" data="__LIKE__" />
          </InlineKeyboard>
        }
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Voice
          assetTag="my_voice"
          caption="__MyVoice__"
          disableNotification={true}
          duration={100}
          file={
            {
              "data": "__DATA__",
              "fileName": "baz.wmv",
            }
          }
          parseMode="MarkdownV2"
          replyMarkup={
            <InlineKeyboard>
              <CallbackButton
                data="__LIKE__"
                text="Like"
              />
            </InlineKeyboard>
          }
          replyToMessageId={123}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [
            {
              "assetTag": "my_voice",
              "fieldName": "voice",
              "source": {
                "data": "__DATA__",
                "fileName": "baz.wmv",
              },
            },
          ],
          "method": "sendVoice",
          "params": {
            "caption": "__MyVoice__",
            "disable_notification": true,
            "duration": 100,
            "parse_mode": "MarkdownV2",
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "callback_data": "__LIKE__",
                    "text": "Like",
                  },
                ],
              ],
            },
            "reply_to_message_id": 123,
            "voice": undefined,
          },
        },
      },
    ]
  `);
});

test('VideoNote match snapshot', async () => {
  await expect(
    render(<VideoNote fileId="12345" caption={<b>My Video Note</b>} />),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <VideoNote
          caption={
            <b>
              My Video Note
            </b>
          }
          fileId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [],
          "method": "sendVideoNote",
          "params": {
            "caption": "<b>My Video Note</b>",
            "disable_notification": undefined,
            "duration": undefined,
            "length": undefined,
            "parse_mode": "HTML",
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
            "video_note": "12345",
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <VideoNote
        url="http://foo.bar/baz.mpeg"
        caption="PlainTextCaption"
        parseMode="None"
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <VideoNote
          caption="PlainTextCaption"
          parseMode="None"
          url="http://foo.bar/baz.mpeg"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [],
          "method": "sendVideoNote",
          "params": {
            "caption": "PlainTextCaption",
            "disable_notification": undefined,
            "duration": undefined,
            "length": undefined,
            "parse_mode": undefined,
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
            "video_note": "http://foo.bar/baz.mpeg",
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <VideoNote
        file={{
          data: '__DATA__',
          fileName: 'baz.mpeg',
        }}
        assetTag="my_video_note"
        parseMode="MarkdownV2"
        caption="__MyVideoNote__"
        thumbnailFile={{
          data: '__THUMB_DATA__',
          fileName: 'baz.jpg',
        }}
        duration={100}
        length={1080}
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Like" data="__LIKE__" />
          </InlineKeyboard>
        }
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <VideoNote
          assetTag="my_video_note"
          caption="__MyVideoNote__"
          disableNotification={true}
          duration={100}
          file={
            {
              "data": "__DATA__",
              "fileName": "baz.mpeg",
            }
          }
          length={1080}
          parseMode="MarkdownV2"
          replyMarkup={
            <InlineKeyboard>
              <CallbackButton
                data="__LIKE__"
                text="Like"
              />
            </InlineKeyboard>
          }
          replyToMessageId={123}
          thumbnailFile={
            {
              "data": "__THUMB_DATA__",
              "fileName": "baz.jpg",
            }
          }
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [
            {
              "assetTag": "my_video_note",
              "fieldName": "video_note",
              "source": {
                "data": "__DATA__",
                "fileName": "baz.mpeg",
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
          "method": "sendVideoNote",
          "params": {
            "caption": "__MyVideoNote__",
            "disable_notification": true,
            "duration": 100,
            "length": 1080,
            "parse_mode": "MarkdownV2",
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "callback_data": "__LIKE__",
                    "text": "Like",
                  },
                ],
              ],
            },
            "reply_to_message_id": 123,
            "video_note": undefined,
          },
        },
      },
    ]
  `);
});

test('MediaGroup match snapshot', async () => {
  await expect(
    render(
      <MediaGroup>
        <Photo fileId="12345" />
        <Video
          url="http://my.video/xxx"
          caption="PlainTextCaption"
          parseMode="None"
        />
      </MediaGroup>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <MediaGroup>
          <Photo
            fileId="12345"
          />
          <Video
            caption="PlainTextCaption"
            parseMode="None"
            url="http://my.video/xxx"
          />
        </MediaGroup>,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [],
          "method": "sendMediaGroup",
          "params": {
            "disable_notification": undefined,
            "media": [
              {
                "caption": undefined,
                "media": "12345",
                "parse_mode": "HTML",
                "type": "photo",
              },
              {
                "caption": "PlainTextCaption",
                "duration": undefined,
                "height": undefined,
                "media": "http://my.video/xxx",
                "parse_mode": undefined,
                "supports_streaming": undefined,
                "thumb": undefined,
                "type": "video",
                "width": undefined,
              },
            ],
            "reply_to_message_id": undefined,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <MediaGroup disableNotification replyToMessageId={123}>
        <Photo
          file={{
            data: '__DATA__',
            fileName: 'baz.jpg',
          }}
          assetTag="my_photo"
          parseMode="MarkdownV2"
          caption="__MyPhoto__"
        />

        <Video
          file={{
            data: '__DATA__',
            fileName: 'baz.mpeg',
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
        />
      </MediaGroup>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <MediaGroup
          disableNotification={true}
          replyToMessageId={123}
        >
          <Photo
            assetTag="my_photo"
            caption="__MyPhoto__"
            file={
              {
                "data": "__DATA__",
                "fileName": "baz.jpg",
              }
            }
            parseMode="MarkdownV2"
          />
          <Video
            assetTag="my_video"
            caption="__MyVideo__"
            duration={100}
            file={
              {
                "data": "__DATA__",
                "fileName": "baz.mpeg",
              }
            }
            height={1080}
            parseMode="MarkdownV2"
            thumbnailFile={
              {
                "data": "__THUMB_DATA__",
                "fileName": "baz.jpg",
              }
            }
            width={1920}
          />
        </MediaGroup>,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [
            {
              "assetTag": "my_photo",
              "fieldName": "file_0",
              "source": {
                "data": "__DATA__",
                "fileName": "baz.jpg",
              },
            },
            {
              "assetTag": "my_video",
              "fieldName": "file_1",
              "source": {
                "data": "__DATA__",
                "fileName": "baz.mpeg",
              },
            },
            {
              "assetTag": undefined,
              "fieldName": "file_2",
              "source": {
                "data": "__THUMB_DATA__",
                "fileName": "baz.jpg",
              },
            },
          ],
          "method": "sendMediaGroup",
          "params": {
            "disable_notification": true,
            "media": [
              {
                "caption": "__MyPhoto__",
                "media": "attach://file_0",
                "parse_mode": "MarkdownV2",
                "type": "photo",
              },
              {
                "caption": "__MyVideo__",
                "duration": 100,
                "height": 1080,
                "media": "attach://file_1",
                "parse_mode": "MarkdownV2",
                "supports_streaming": undefined,
                "thumb": "attach://file_2",
                "type": "video",
                "width": 1920,
              },
            ],
            "reply_to_message_id": 123,
          },
        },
      },
    ]
  `);
});

test('Sticker match snapshot', async () => {
  await expect(render(<Sticker fileId="12345" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <Sticker
          fileId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": undefined,
          "method": "sendSticker",
          "params": {
            "disable_notification": undefined,
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
            "sticker": "12345",
          },
        },
      },
    ]
  `);
  await expect(render(<Sticker url="http://foo.bar/baz.webp" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <Sticker
          url="http://foo.bar/baz.webp"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": undefined,
          "method": "sendSticker",
          "params": {
            "disable_notification": undefined,
            "reply_markup": undefined,
            "reply_to_message_id": undefined,
            "sticker": "http://foo.bar/baz.webp",
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <Sticker
        file={{
          data: '__DATA__',
          fileName: 'baz.gif',
        }}
        assetTag="my_sticker"
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Like" data="__LIKE__" />
          </InlineKeyboard>
        }
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Sticker
          assetTag="my_sticker"
          disableNotification={true}
          file={
            {
              "data": "__DATA__",
              "fileName": "baz.gif",
            }
          }
          replyMarkup={
            <InlineKeyboard>
              <CallbackButton
                data="__LIKE__"
                text="Like"
              />
            </InlineKeyboard>
          }
          replyToMessageId={123}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [
            {
              "assetTag": "my_sticker",
              "fieldName": "sticker",
              "source": {
                "data": "__DATA__",
                "fileName": "baz.gif",
              },
            },
          ],
          "method": "sendSticker",
          "params": {
            "disable_notification": true,
            "reply_markup": {
              "inline_keyboard": [
                [
                  {
                    "callback_data": "__LIKE__",
                    "text": "Like",
                  },
                ],
              ],
            },
            "reply_to_message_id": 123,
            "sticker": undefined,
          },
        },
      },
    ]
  `);
});
