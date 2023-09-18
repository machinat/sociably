import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Audio, Image, Document, Video, Sticker } from '../Media.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  for (const Media of [Audio, Image, Document, Video, Sticker]) {
    expect(isNativeType(<Media mediaId="123" />)).toBe(true);
    expect(Media.$$platform).toBe('whatsapp');
  }
});

test.each([
  ['audio', Audio],
  ['image', Image],
  ['document', Document],
  ['video', Video],
  ['sticker', Sticker],
])('rendering %s value', async (type, Media) => {
  let mediaElement = <Media mediaId="123" />;
  await expect(renderUnitElement(mediaElement)).resolves.toEqual([
    {
      type: 'unit',
      node: mediaElement,
      path: '$',
      value: { message: { type, [type]: { id: '123' } } },
    },
  ]);
  mediaElement = <Media url="http://foo.bar/baz" replyTo="MESSAGE_ID" />;
  await expect(renderUnitElement(mediaElement)).resolves.toEqual([
    {
      type: 'unit',
      node: <Media url="http://foo.bar/baz" replyTo="MESSAGE_ID" />,
      path: '$',
      value: {
        message: {
          type,
          [type]: { link: 'http://foo.bar/baz' },
          context: { message_id: 'MESSAGE_ID' },
        },
      },
    },
  ]);
  const fileData = Buffer.from('_BINARY_DATA_');
  mediaElement = (
    <Media
      file={{ data: fileData, contentType: 'foo/bar' }}
      assetTag="_ASSET_TAG_"
    />
  );
  await expect(renderUnitElement(mediaElement)).resolves.toEqual([
    {
      type: 'unit',
      node: mediaElement,
      path: '$',
      value: {
        message: { type, [type]: {} },
        file: {
          data: fileData,
          contentType: 'foo/bar',
        },
        assetTag: '_ASSET_TAG_',
      },
    },
  ]);
});

test.each([
  ['image', Image],
  ['document', Document],
  ['video', Video],
])('rendering %s value with caption', async (type, Media) => {
  let mediaElement = <Media mediaId="123" caption="FOO" />;
  await expect(renderUnitElement(mediaElement)).resolves.toEqual([
    {
      type: 'unit',
      node: mediaElement,
      path: '$',
      value: {
        message: { type, [type]: { id: '123', caption: 'FOO' } },
      },
    },
  ]);
  mediaElement = (
    <Media
      url="http://foo.bar/baz"
      assetTag="_ASSET_TAG_"
      caption={
        <>
          FOO {'BAR'} <>BAZ</>
        </>
      }
    />
  );
  await expect(renderUnitElement(mediaElement)).resolves.toEqual([
    {
      type: 'unit',
      node: mediaElement,
      path: '$',
      value: {
        message: {
          type,
          [type]: { link: 'http://foo.bar/baz', caption: 'FOO BAR BAZ' },
        },
        assetTag: '_ASSET_TAG_',
      },
    },
  ]);
});

test('rendering document with fileName', async () => {
  await expect(
    renderUnitElement(<Document mediaId="123" fileName="foo.pdf" />),
  ).resolves.toEqual([
    {
      type: 'unit',
      node: <Document mediaId="123" fileName="foo.pdf" />,
      path: '$',
      value: {
        message: {
          type: 'document',
          document: { id: '123', filename: 'foo.pdf' },
        },
      },
    },
  ]);
});

test('throw when invalid props received', async () => {
  /* eslint-disable no-await-in-loop */
  for (const Media of [Audio, Image, Document, Video, Sticker]) {
    await expect(
      renderUnitElement(<Media />),
    ).rejects.toThrowErrorMatchingSnapshot();
    await expect(
      renderUnitElement(<Media mediaId="123" url="http://foo.bar/baz" />),
    ).rejects.toThrowErrorMatchingSnapshot();
    await expect(
      renderUnitElement(
        <Media
          file={{ data: Buffer.from('FOO'), contentType: 'plain/text' }}
          url="http://foo.bar/baz"
        />,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
    await expect(
      renderUnitElement(
        <Media
          mediaId="123"
          file={{ data: Buffer.from(''), contentType: 'foo/bar' }}
        />,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  }
  for (const Media of [Image, Document, Video]) {
    await expect(
      renderUnitElement(
        <Media mediaId="123" caption={<Image mediaId="456" />} />,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  }
});
