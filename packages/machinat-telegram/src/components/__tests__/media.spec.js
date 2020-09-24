import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils/isX';
import Renderer from '@machinat/core/renderer';
import { InlineKeyboard, CallbackButton } from '../replyMarkup';
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
} from '../media';

const renderer = new Renderer('telegram', (node, path) => [
  {
    type: 'text',
    node,
    path,
    value: `<${node.type}>${node.props.children}</${node.type}>`,
  },
]);

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
    expect(typeof LocationAction).toBe('function');
    expect(isNativeType(<LocationAction />)).toBe(true);
    expect(LocationAction.$$platform).toBe('telegram');
  });
});

test('Photo match snapshot', async () => {
  await expect(
    renderer.render(<Photo fileId="12345" caption={<b>My Photo</b>} />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
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
              "value": Object {
                "method": "sendPhoto",
                "parameters": Object {
                  "caption": "<b>My Photo</b>",
                  "disable_notification": undefined,
                  "parse_mode": "HTML",
                  "photo": "12345",
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                },
                "uploadingFiles": undefined,
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Photo
        url="http://foo.bar/baz.jpg"
        caption="PlainTextCaption"
        parseMode="None"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Photo
                caption="PlainTextCaption"
                parseMode="None"
                url="http://foo.bar/baz.jpg"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendPhoto",
                "parameters": Object {
                  "caption": "PlainTextCaption",
                  "disable_notification": undefined,
                  "parse_mode": undefined,
                  "photo": "http://foo.bar/baz.jpg",
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                },
                "uploadingFiles": undefined,
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Photo
        fileData="__DATA__"
        fileInfo={{ fileName: 'baz.jpg' }}
        fileAssetTag="my_photo"
        parseMode="MarkdownV2"
        caption="__MyPhoto__"
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Like" data="__LIKE__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Photo
                caption="__MyPhoto__"
                disableNotification={true}
                fileAssetTag="my_photo"
                fileData="__DATA__"
                fileInfo={
                  Object {
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
              "value": Object {
                "method": "sendPhoto",
                "parameters": Object {
                  "caption": "__MyPhoto__",
                  "disable_notification": true,
                  "parse_mode": "MarkdownV2",
                  "photo": undefined,
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__LIKE__",
                        "text": "Like",
                      },
                    ],
                  },
                  "reply_to_message_id": 123,
                },
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

test('Animation match snapshot', async () => {
  await expect(
    renderer.render(<Animation fileId="12345" caption={<b>My Animation</b>} />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
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
              "value": Object {
                "method": "sendAnimation",
                "parameters": Object {
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
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Animation
        url="http://foo.bar/baz.gif"
        caption="PlainTextCaption"
        parseMode="None"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Animation
                caption="PlainTextCaption"
                parseMode="None"
                url="http://foo.bar/baz.gif"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendAnimation",
                "parameters": Object {
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
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Animation
        fileData="__DATA__"
        fileInfo={{ fileName: 'baz.gif' }}
        fileAssetTag="my_animate"
        parseMode="MarkdownV2"
        caption="__MyAnimation__"
        thumbnailFileData="__THUMB_DATA__"
        thumbnailFileInfo={{ fileName: 'baz.jpg' }}
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
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Animation
                caption="__MyAnimation__"
                disableNotification={true}
                duration={100}
                fileAssetTag="my_animate"
                fileData="__DATA__"
                fileInfo={
                  Object {
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
                thumbnailFileData="__THUMB_DATA__"
                thumbnailFileInfo={
                  Object {
                    "fileName": "baz.jpg",
                  }
                }
                width={1920}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendAnimation",
                "parameters": Object {
                  "animation": undefined,
                  "caption": "__MyAnimation__",
                  "disable_notification": true,
                  "duration": 100,
                  "height": 1080,
                  "parse_mode": "MarkdownV2",
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__LIKE__",
                        "text": "Like",
                      },
                    ],
                  },
                  "reply_to_message_id": 123,
                  "width": 1920,
                },
                "uploadingFiles": Array [
                  Object {
                    "fieldName": "animation",
                    "fileAssetTag": "my_animate",
                    "fileData": "__DATA__",
                    "fileInfo": Object {
                      "fileName": "baz.gif",
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
});

test('Audio match snapshot', async () => {
  await expect(
    renderer.render(<Audio fileId="12345" caption={<b>My Audio</b>} />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
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
              "value": Object {
                "method": "sendAudio",
                "parameters": Object {
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
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Audio
        url="http://foo.bar/baz.mp3"
        caption="PlainTextCaption"
        parseMode="None"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Audio
                caption="PlainTextCaption"
                parseMode="None"
                url="http://foo.bar/baz.mp3"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendAudio",
                "parameters": Object {
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
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Audio
        fileData="__DATA__"
        fileInfo={{ fileName: 'baz.mp3' }}
        fileAssetTag="my_audio"
        parseMode="MarkdownV2"
        caption="__MyAudio__"
        thumbnailFileData="__THUMB_DATA__"
        thumbnailFileInfo={{ fileName: 'baz.jpg' }}
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
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Audio
                caption="__MyAudio__"
                disableNotification={true}
                duration={100}
                fileAssetTag="my_audio"
                fileData="__DATA__"
                fileInfo={
                  Object {
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
                thumbnailFileData="__THUMB_DATA__"
                thumbnailFileInfo={
                  Object {
                    "fileName": "baz.jpg",
                  }
                }
                title="Foo"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendAudio",
                "parameters": Object {
                  "audio": undefined,
                  "caption": "__MyAudio__",
                  "disable_notification": true,
                  "duration": 100,
                  "parse_mode": "MarkdownV2",
                  "performer": "John Doe",
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__LIKE__",
                        "text": "Like",
                      },
                    ],
                  },
                  "reply_to_message_id": 123,
                  "title": "Foo",
                },
                "uploadingFiles": Array [
                  Object {
                    "fieldName": "audio",
                    "fileAssetTag": "my_audio",
                    "fileData": "__DATA__",
                    "fileInfo": Object {
                      "fileName": "baz.mp3",
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
});

test('Document match snapshot', async () => {
  await expect(
    renderer.render(<Document fileId="12345" caption={<b>My Document</b>} />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
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
              "value": Object {
                "method": "sendDocument",
                "parameters": Object {
                  "caption": "<b>My Document</b>",
                  "disable_notification": undefined,
                  "document": "12345",
                  "parse_mode": "HTML",
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                },
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Document
        url="http://foo.bar/baz.txt"
        caption="PlainTextCaption"
        parseMode="None"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Document
                caption="PlainTextCaption"
                parseMode="None"
                url="http://foo.bar/baz.txt"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendDocument",
                "parameters": Object {
                  "caption": "PlainTextCaption",
                  "disable_notification": undefined,
                  "document": "http://foo.bar/baz.txt",
                  "parse_mode": undefined,
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                },
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Document
        fileData="__DATA__"
        fileInfo={{ fileName: 'baz.txt' }}
        fileAssetTag="my_doc"
        parseMode="MarkdownV2"
        caption="__MyDocument__"
        thumbnailFileData="__THUMB_DATA__"
        thumbnailFileInfo={{ fileName: 'baz.jpg' }}
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Like" data="__LIKE__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Document
                caption="__MyDocument__"
                disableNotification={true}
                fileAssetTag="my_doc"
                fileData="__DATA__"
                fileInfo={
                  Object {
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
                thumbnailFileData="__THUMB_DATA__"
                thumbnailFileInfo={
                  Object {
                    "fileName": "baz.jpg",
                  }
                }
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendDocument",
                "parameters": Object {
                  "caption": "__MyDocument__",
                  "disable_notification": true,
                  "document": undefined,
                  "parse_mode": "MarkdownV2",
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__LIKE__",
                        "text": "Like",
                      },
                    ],
                  },
                  "reply_to_message_id": 123,
                },
                "uploadingFiles": Array [
                  Object {
                    "fieldName": "document",
                    "fileAssetTag": "my_doc",
                    "fileData": "__DATA__",
                    "fileInfo": Object {
                      "fileName": "baz.txt",
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
});

test('Video match snapshot', async () => {
  await expect(
    renderer.render(<Video fileId="12345" caption={<b>My Video</b>} />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
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
              "value": Object {
                "method": "sendVideo",
                "parameters": Object {
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
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Video
        url="http://foo.bar/baz.mp4"
        caption="PlainTextCaption"
        parseMode="None"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Video
                caption="PlainTextCaption"
                parseMode="None"
                url="http://foo.bar/baz.mp4"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendVideo",
                "parameters": Object {
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
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
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
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Like" data="__LIKE__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Video
                caption="__MyVideo__"
                disableNotification={true}
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
                thumbnailFileData="__THUMB_DATA__"
                thumbnailFileInfo={
                  Object {
                    "fileName": "baz.jpg",
                  }
                }
                width={1920}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendVideo",
                "parameters": Object {
                  "caption": "__MyVideo__",
                  "disable_notification": true,
                  "duration": 100,
                  "height": 1080,
                  "parse_mode": "MarkdownV2",
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__LIKE__",
                        "text": "Like",
                      },
                    ],
                  },
                  "reply_to_message_id": 123,
                  "supports_streaming": true,
                  "video": undefined,
                  "width": 1920,
                },
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
});

test('Voice match snapshot', async () => {
  await expect(
    renderer.render(<Voice fileId="12345" caption={<b>My Voice</b>} />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
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
              "value": Object {
                "method": "sendVoice",
                "parameters": Object {
                  "caption": "<b>My Voice</b>",
                  "disable_notification": undefined,
                  "duration": undefined,
                  "parse_mode": "HTML",
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                  "voice": "12345",
                },
                "uploadingFiles": undefined,
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Voice
        url="http://foo.bar/baz.wmv"
        caption="PlainTextCaption"
        parseMode="None"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Voice
                caption="PlainTextCaption"
                parseMode="None"
                url="http://foo.bar/baz.wmv"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendVoice",
                "parameters": Object {
                  "caption": "PlainTextCaption",
                  "disable_notification": undefined,
                  "duration": undefined,
                  "parse_mode": undefined,
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                  "voice": "http://foo.bar/baz.wmv",
                },
                "uploadingFiles": undefined,
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Voice
        fileData="__DATA__"
        fileInfo={{ fileName: 'baz.wmv' }}
        fileAssetTag="my_voice"
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
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Voice
                caption="__MyVoice__"
                disableNotification={true}
                duration={100}
                fileAssetTag="my_voice"
                fileData="__DATA__"
                fileInfo={
                  Object {
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
              "value": Object {
                "method": "sendVoice",
                "parameters": Object {
                  "caption": "__MyVoice__",
                  "disable_notification": true,
                  "duration": 100,
                  "parse_mode": "MarkdownV2",
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__LIKE__",
                        "text": "Like",
                      },
                    ],
                  },
                  "reply_to_message_id": 123,
                  "voice": undefined,
                },
                "uploadingFiles": Array [
                  Object {
                    "fieldName": "voice",
                    "fileAssetTag": "my_voice",
                    "fileData": "__DATA__",
                    "fileInfo": Object {
                      "fileName": "baz.wmv",
                    },
                  },
                ],
              },
            },
          ]
        `);
});

test('VideoNote match snapshot', async () => {
  await expect(
    renderer.render(<VideoNote fileId="12345" caption={<b>My Video Note</b>} />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
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
              "value": Object {
                "method": "sendVideoNote",
                "parameters": Object {
                  "caption": "<b>My Video Note</b>",
                  "disable_notification": undefined,
                  "duration": undefined,
                  "length": undefined,
                  "parse_mode": "HTML",
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                  "video_note": "12345",
                },
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <VideoNote
        url="http://foo.bar/baz.mpeg"
        caption="PlainTextCaption"
        parseMode="None"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <VideoNote
                caption="PlainTextCaption"
                parseMode="None"
                url="http://foo.bar/baz.mpeg"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendVideoNote",
                "parameters": Object {
                  "caption": "PlainTextCaption",
                  "disable_notification": undefined,
                  "duration": undefined,
                  "length": undefined,
                  "parse_mode": undefined,
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                  "video_note": "http://foo.bar/baz.mpeg",
                },
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <VideoNote
        fileData="__DATA__"
        fileInfo={{ fileName: 'baz.mpeg' }}
        fileAssetTag="my_video_note"
        parseMode="MarkdownV2"
        caption="__MyVideoNote__"
        thumbnailFileData="__THUMB_DATA__"
        thumbnailFileInfo={{ fileName: 'baz.jpg' }}
        duration={100}
        length={1080}
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Like" data="__LIKE__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <VideoNote
                caption="__MyVideoNote__"
                disableNotification={true}
                duration={100}
                fileAssetTag="my_video_note"
                fileData="__DATA__"
                fileInfo={
                  Object {
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
                thumbnailFileData="__THUMB_DATA__"
                thumbnailFileInfo={
                  Object {
                    "fileName": "baz.jpg",
                  }
                }
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendVideoNote",
                "parameters": Object {
                  "caption": "__MyVideoNote__",
                  "disable_notification": true,
                  "duration": 100,
                  "length": 1080,
                  "parse_mode": "MarkdownV2",
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__LIKE__",
                        "text": "Like",
                      },
                    ],
                  },
                  "reply_to_message_id": 123,
                  "video_note": undefined,
                },
                "uploadingFiles": Array [
                  Object {
                    "fieldName": "video_note",
                    "fileAssetTag": "my_video_note",
                    "fileData": "__DATA__",
                    "fileInfo": Object {
                      "fileName": "baz.mpeg",
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
});

test('MediaGroup match snapshot', async () => {
  await expect(
    renderer.render(
      <MediaGroup>
        <Photo fileId="12345" />
        <Video
          url="http://my.video/xxx"
          caption="PlainTextCaption"
          parseMode="None"
        />
      </MediaGroup>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
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
              "value": Object {
                "method": "sendMediaGroup",
                "parameters": Object {
                  "disable_notification": undefined,
                  "media": Array [
                    Object {
                      "caption": undefined,
                      "media": "12345",
                      "parse_mode": "HTML",
                      "type": "photo",
                    },
                    Object {
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
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <MediaGroup disableNotification replyToMessageId={123}>
        <Photo
          fileData="__DATA__"
          fileInfo={{ fileName: 'baz.jpg' }}
          fileAssetTag="my_photo"
          parseMode="MarkdownV2"
          caption="__MyPhoto__"
        />
        <Video
          fileData="__DATA__"
          fileInfo={{ fileName: 'baz.mpeg' }}
          fileAssetTag="my_video"
          parseMode="MarkdownV2"
          caption="__MyVideo__"
          thumbnailFileData="__THUMB_DATA__"
          thumbnailFileInfo={{ fileName: 'baz.jpg' }}
          duration={100}
          width={1920}
          height={1080}
        />
      </MediaGroup>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <MediaGroup
                disableNotification={true}
                replyToMessageId={123}
              >
                <Photo
                  caption="__MyPhoto__"
                  fileAssetTag="my_photo"
                  fileData="__DATA__"
                  fileInfo={
                    Object {
                      "fileName": "baz.jpg",
                    }
                  }
                  parseMode="MarkdownV2"
                />
                <Video
                  caption="__MyVideo__"
                  duration={100}
                  fileAssetTag="my_video"
                  fileData="__DATA__"
                  fileInfo={
                    Object {
                      "fileName": "baz.mpeg",
                    }
                  }
                  height={1080}
                  parseMode="MarkdownV2"
                  thumbnailFileData="__THUMB_DATA__"
                  thumbnailFileInfo={
                    Object {
                      "fileName": "baz.jpg",
                    }
                  }
                  width={1920}
                />
              </MediaGroup>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendMediaGroup",
                "parameters": Object {
                  "disable_notification": true,
                  "media": Array [
                    Object {
                      "caption": "__MyPhoto__",
                      "media": "attach://file_0",
                      "parse_mode": "MarkdownV2",
                      "type": "photo",
                    },
                    Object {
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
                "uploadingFiles": Array [
                  Object {
                    "fieldName": "file_0",
                    "fileAssetTag": "my_photo",
                    "fileData": "__DATA__",
                    "fileInfo": Object {
                      "fileName": "baz.jpg",
                    },
                  },
                  Object {
                    "fieldName": "file_1",
                    "fileAssetTag": "my_video",
                    "fileData": "__DATA__",
                    "fileInfo": Object {
                      "fileName": "baz.mpeg",
                    },
                  },
                  Object {
                    "fieldName": "file_2",
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
});

test('Sticker match snapshot', async () => {
  await expect(renderer.render(<Sticker fileId="12345" />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Sticker
                fileId="12345"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendSticker",
                "parameters": Object {
                  "disable_notification": undefined,
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                  "sticker": "12345",
                },
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(renderer.render(<Sticker url="http://foo.bar/baz.webp" />))
    .resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Sticker
                url="http://foo.bar/baz.webp"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendSticker",
                "parameters": Object {
                  "disable_notification": undefined,
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                  "sticker": "http://foo.bar/baz.webp",
                },
                "uploadingFiles": Array [],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Sticker
        fileData="__DATA__"
        fileInfo={{ fileName: 'baz.gif' }}
        fileAssetTag="my_sticker"
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Like" data="__LIKE__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Sticker
                disableNotification={true}
                fileAssetTag="my_sticker"
                fileData="__DATA__"
                fileInfo={
                  Object {
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
              "value": Object {
                "method": "sendSticker",
                "parameters": Object {
                  "disable_notification": true,
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__LIKE__",
                        "text": "Like",
                      },
                    ],
                  },
                  "reply_to_message_id": 123,
                  "sticker": undefined,
                },
                "uploadingFiles": Array [
                  Object {
                    "fieldName": "sticker",
                    "fileAssetTag": "my_sticker",
                    "fileData": "__DATA__",
                    "fileInfo": Object {
                      "fileName": "baz.gif",
                    },
                  },
                ],
              },
            },
          ]
        `);
});
