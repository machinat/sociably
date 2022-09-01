import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { renderUnitElement } from './utils';
import { Image, Video, Audio, File } from '../media';

describe('media Components', () => {
  test.each([Image, Video, Audio, File])('is valid root Component', (Media) => {
    expect(typeof Media).toBe('function');
    expect(isNativeType(<Media />)).toBe(true);
    expect(Media.$$platform).toBe('messenger');
  });

  it('match snapshot', async () => {
    const segments = await renderUnitElement(
      <>
        <Image url="http://this.is/a/picture" reusable />
        <Image attachmentId="_I_am_Image_" />
        <Image fileData="_IMAGE_BINARY_DATA_" />
        <Video url="http://this.is/a/video" reusable />
        <Video attachmentId="_I_am_Video_" />
        <Video
          fileData="_VIDEO_BINARY_DATA_"
          fileInfo={{ filename: 'foo.mp4' }}
        />
        <Audio url="http://this.is/an/audio" reusable />
        <Audio attachmentId="_I_am_Audio_" />
        <Audio fileData="_AUDIO_BINARY_DATA_" assetTag="foo_audio" reusable />
        <File url="http://this.is/a/file" reusable />
        <File attachmentId="_I_am_File_" />
        <File
          reusable
          fileData="_FILE_BINARY_DATA_"
          assetTag="foo_file"
          fileInfo={{ filename: 'foo.pdf' }}
        />
      </>
    );
    expect(segments).toMatchSnapshot();
    expect(segments?.map((seg) => seg.value)).toMatchInlineSnapshot(`
      Array [
        Object {
          "apiPath": "me/messages",
          "attachFile": undefined,
          "params": Object {
            "message": Object {
              "attachment": Object {
                "payload": Object {
                  "attachment_id": undefined,
                  "is_reusable": true,
                  "url": "http://this.is/a/picture",
                },
                "type": "image",
              },
            },
          },
        },
        Object {
          "apiPath": "me/messages",
          "attachFile": undefined,
          "params": Object {
            "message": Object {
              "attachment": Object {
                "payload": Object {
                  "attachment_id": "_I_am_Image_",
                  "is_reusable": undefined,
                  "url": undefined,
                },
                "type": "image",
              },
            },
          },
        },
        Object {
          "apiPath": "me/messages",
          "attachFile": Object {
            "assetTag": undefined,
            "data": "_IMAGE_BINARY_DATA_",
            "info": undefined,
          },
          "params": Object {
            "message": Object {
              "attachment": Object {
                "payload": Object {
                  "attachment_id": undefined,
                  "is_reusable": undefined,
                  "url": undefined,
                },
                "type": "image",
              },
            },
          },
        },
        Object {
          "apiPath": "me/messages",
          "attachFile": undefined,
          "params": Object {
            "message": Object {
              "attachment": Object {
                "payload": Object {
                  "attachment_id": undefined,
                  "is_reusable": true,
                  "url": "http://this.is/a/video",
                },
                "type": "video",
              },
            },
          },
        },
        Object {
          "apiPath": "me/messages",
          "attachFile": undefined,
          "params": Object {
            "message": Object {
              "attachment": Object {
                "payload": Object {
                  "attachment_id": "_I_am_Video_",
                  "is_reusable": undefined,
                  "url": undefined,
                },
                "type": "video",
              },
            },
          },
        },
        Object {
          "apiPath": "me/messages",
          "attachFile": Object {
            "assetTag": undefined,
            "data": "_VIDEO_BINARY_DATA_",
            "info": Object {
              "filename": "foo.mp4",
            },
          },
          "params": Object {
            "message": Object {
              "attachment": Object {
                "payload": Object {
                  "attachment_id": undefined,
                  "is_reusable": undefined,
                  "url": undefined,
                },
                "type": "video",
              },
            },
          },
        },
        Object {
          "apiPath": "me/messages",
          "attachFile": undefined,
          "params": Object {
            "message": Object {
              "attachment": Object {
                "payload": Object {
                  "attachment_id": undefined,
                  "is_reusable": true,
                  "url": "http://this.is/an/audio",
                },
                "type": "audio",
              },
            },
          },
        },
        Object {
          "apiPath": "me/messages",
          "attachFile": undefined,
          "params": Object {
            "message": Object {
              "attachment": Object {
                "payload": Object {
                  "attachment_id": "_I_am_Audio_",
                  "is_reusable": undefined,
                  "url": undefined,
                },
                "type": "audio",
              },
            },
          },
        },
        Object {
          "apiPath": "me/messages",
          "attachFile": Object {
            "assetTag": "foo_audio",
            "data": "_AUDIO_BINARY_DATA_",
            "info": undefined,
          },
          "params": Object {
            "message": Object {
              "attachment": Object {
                "payload": Object {
                  "attachment_id": undefined,
                  "is_reusable": true,
                  "url": undefined,
                },
                "type": "audio",
              },
            },
          },
        },
        Object {
          "apiPath": "me/messages",
          "attachFile": undefined,
          "params": Object {
            "message": Object {
              "attachment": Object {
                "payload": Object {
                  "attachment_id": undefined,
                  "is_reusable": true,
                  "url": "http://this.is/a/file",
                },
                "type": "file",
              },
            },
          },
        },
        Object {
          "apiPath": "me/messages",
          "attachFile": undefined,
          "params": Object {
            "message": Object {
              "attachment": Object {
                "payload": Object {
                  "attachment_id": "_I_am_File_",
                  "is_reusable": undefined,
                  "url": undefined,
                },
                "type": "file",
              },
            },
          },
        },
        Object {
          "apiPath": "me/messages",
          "attachFile": Object {
            "assetTag": "foo_file",
            "data": "_FILE_BINARY_DATA_",
            "info": Object {
              "filename": "foo.pdf",
            },
          },
          "params": Object {
            "message": Object {
              "attachment": Object {
                "payload": Object {
                  "attachment_id": undefined,
                  "is_reusable": true,
                  "url": undefined,
                },
                "type": "file",
              },
            },
          },
        },
      ]
    `);
  });
});
