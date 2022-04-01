import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils';
import Renderer from '@machinat/core/renderer';

import { Image, Video, Audio, File } from '../media';

const renderer = new Renderer('messenger', () => null);

describe('media Components', () => {
  test.each([Image, Video, Audio, File])('is valid root Component', (Media) => {
    expect(typeof Media).toBe('function');
    expect(isNativeType(<Media />)).toBe(true);
    expect(Media.$$platform).toBe('messenger');
  });

  it('match snapshot', async () => {
    const segments = await renderer.render(
      <>
        <Image url="http://this.is/a/picture" reusable />
        <Image attachmentId="_I_am_Image_" />
        <Video url="http://this.is/a/video" reusable />
        <Video attachmentId="_I_am_Video_" />
        <Audio url="http://this.is/an/audio" reusable />
        <Audio attachmentId="_I_am_Audio_" />
        <File url="http://this.is/a/file" reusable />
        <File attachmentId="_I_am_File_" />
      </>
    );
    expect(segments).toMatchSnapshot();
    expect(segments.map((seg) => seg.value)).toMatchInlineSnapshot(`
      Array [
        Object {
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
          Symbol(attatchment_asset_tag.messenger.machinat): undefined,
          Symbol(attachment_data.messenger.machinat): undefined,
          Symbol(attachment_info.messenger.machinat): undefined,
        },
        Object {
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
          Symbol(attatchment_asset_tag.messenger.machinat): undefined,
          Symbol(attachment_data.messenger.machinat): undefined,
          Symbol(attachment_info.messenger.machinat): undefined,
        },
        Object {
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
          Symbol(attatchment_asset_tag.messenger.machinat): undefined,
          Symbol(attachment_data.messenger.machinat): undefined,
          Symbol(attachment_info.messenger.machinat): undefined,
        },
        Object {
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
          Symbol(attatchment_asset_tag.messenger.machinat): undefined,
          Symbol(attachment_data.messenger.machinat): undefined,
          Symbol(attachment_info.messenger.machinat): undefined,
        },
        Object {
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
          Symbol(attatchment_asset_tag.messenger.machinat): undefined,
          Symbol(attachment_data.messenger.machinat): undefined,
          Symbol(attachment_info.messenger.machinat): undefined,
        },
        Object {
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
          Symbol(attatchment_asset_tag.messenger.machinat): undefined,
          Symbol(attachment_data.messenger.machinat): undefined,
          Symbol(attachment_info.messenger.machinat): undefined,
        },
        Object {
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
          Symbol(attatchment_asset_tag.messenger.machinat): undefined,
          Symbol(attachment_data.messenger.machinat): undefined,
          Symbol(attachment_info.messenger.machinat): undefined,
        },
        Object {
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
          Symbol(attatchment_asset_tag.messenger.machinat): undefined,
          Symbol(attachment_data.messenger.machinat): undefined,
          Symbol(attachment_info.messenger.machinat): undefined,
        },
      ]
    `);
  });
});
