import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import { Photo, Video, AnimatedGif } from '../Media';

const renderer = new Renderer('twitter', async () => null);
const render = (element) => renderer.render(element, null, null);

const mediaNameComponentPairs = [Photo, Video, AnimatedGif].map(
  (Media): [string, typeof Photo] => [Media.name, Media]
);

test.each(mediaNameComponentPairs)('%s is a valid Component', (_, Media) => {
  expect(typeof Media).toBe('function');
  expect(isNativeType(<Media />)).toBe(true);
  expect(Media.$$platform).toBe('twitter');
});

test.each(mediaNameComponentPairs)('%s rendering', async (mediaName, Media) => {
  await expect(render(<Media mediaId="12345" />)).resolves.toMatchSnapshot();
  await expect(
    render(<Media url="http://foo.io/bar.mp4" shared />)
  ).resolves.toMatchSnapshot();
  await expect(
    render(
      <Media
        fileData={Buffer.from('foo')}
        fileSize={1234}
        fileType={
          Media === Photo
            ? 'image/jpeg'
            : Media === Video
            ? 'video/mp4'
            : 'image/gif'
        }
        assetTag={`My${mediaName}`}
        shared
        additionalOwners={['12345']}
        mediaCategory={
          Media === Photo ? 'dm_image' : Media === Video ? 'dm_video' : 'dm_gif'
        }
      />
    )
  ).resolves.toMatchSnapshot();
});

test.each(mediaNameComponentPairs)(
  'throw if no media source is provided',
  async (_, Media) => {
    await expect(render(<Media />)).rejects.toThrow(
      'there should be exactly one of "url", "mediaId" or "fileData" prop'
    );
  }
);

test.each(mediaNameComponentPairs)(
  'throw if multiple media source are provided',
  async (_, Media) => {
    await expect(
      render(<Media mediaId="12345" url="http://..." />)
    ).rejects.toThrow(
      'there should be exactly one of "url", "mediaId" or "fileData" prop'
    );
    await expect(
      render(<Media mediaId="12345" fileData={Buffer.from('foo')} />)
    ).rejects.toThrow(
      'there should be exactly one of "url", "mediaId" or "fileData" prop'
    );
    await expect(
      render(<Media url="http://..." fileData={Buffer.from('foo')} />)
    ).rejects.toThrow(
      'there should be exactly one of "url", "mediaId" or "fileData" prop'
    );
    await expect(
      render(
        <Media mediaId="12345" url="http://..." fileData={Buffer.from('foo')} />
      )
    ).rejects.toThrow(
      'there should be exactly one of "url", "mediaId" or "fileData" prop'
    );
  }
);
