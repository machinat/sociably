import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isXxx';

import { Image, Video, Audio, File } from '../media';

const renderHelper = element => element.type(element, null, '$');

describe('media Components', () => {
  test.each([Image, Video, Audio, File])('is valid root Component', Media => {
    expect(typeof Media).toBe('function');
    expect(isNativeElement(<Media />)).toBe(true);
    expect(Media.$$platform).toBe('messenger');
  });

  it('match snapshot', async () => {
    await expect(
      Promise.all(
        [
          <Image url="http://this.is/a/picture" reusable />,
          <Video url="http://this.is/a/video" reusable />,
          <Audio url="http://this.is/an/audio" reusable />,
          <File url="http://this.is/a/file" reusable />,
          <Image attachmentId="_I_am_Image_" />,
          <Video attachmentId="_I_am_Video_" />,
          <Audio attachmentId="_I_am_Audio_" />,
          <File attachmentId="_I_am_File_" />,
        ].map(renderHelper)
      )
    ).resolves.toMatchSnapshot();
  });
});
