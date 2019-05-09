import Machinat from 'machinat';

import { MESSENGER_NAITVE_TYPE } from '../../constant';
import { Image, Video, Audio, File } from '../media';
import renderHelper from './renderHelper';

const renderInside = jest.fn();
const render = renderHelper(renderInside);

describe('media Components', () => {
  test.each([Image, Video, Audio, File])('is valid root Component', Media => {
    expect(typeof Media).toBe('function');
    expect(Media.$$native).toBe(MESSENGER_NAITVE_TYPE);
    expect(Media.$$entry).toBe('me/messages');
    expect(Media.$$namespace).toBe('Messenger');
  });

  it('match snapshot', () => {
    expect(
      [
        <Image url="http://this.is/a/picture" reusable />,
        <Video url="http://this.is/a/video" reusable />,
        <Audio url="http://this.is/an/audio" reusable />,
        <File url="http://this.is/a/file" reusable />,
        <Image attachmentId="_I_am_Image_" />,
        <Video attachmentId="_I_am_Video_" />,
        <Audio attachmentId="_I_am_Audio_" />,
        <File attachmentId="_I_am_File_" />,
      ].map(render)
    ).toMatchSnapshot();
  });
});
