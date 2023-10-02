import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { PostPhoto } from '../PostPhoto.js';

import { renderUnitElement } from './utils.js';

it('is valid root Component', () => {
  expect(isNativeType(<PostPhoto />)).toBe(true);
  expect(PostPhoto.$$platform).toBe('facebook');
  expect(PostPhoto.$$name).toBe('PostPhoto');
});

it('match snapshot', async () => {
  await expect(
    renderUnitElement(<PostPhoto url="http://sociably.js/awesome.jpg" />),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PostPhoto
          url="http://sociably.js/awesome.jpg"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/photos",
          "file": undefined,
          "params": {
            "backdated_time": undefined,
            "spherical_metadata": undefined,
            "url": "http://sociably.js/awesome.jpg",
            "vault_image_id": undefined,
          },
          "type": "post",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(<PostPhoto file={{ data: Buffer.from('COOL') }} />),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PostPhoto
          file={
            {
              "data": {
                "data": [
                  67,
                  79,
                  79,
                  76,
                ],
                "type": "Buffer",
              },
            }
          }
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/photos",
          "file": {
            "data": {
              "data": [
                67,
                79,
                79,
                76,
              ],
              "type": "Buffer",
            },
          },
          "params": {
            "backdated_time": undefined,
            "spherical_metadata": undefined,
            "url": undefined,
            "vault_image_id": undefined,
          },
          "type": "post",
        },
      },
    ]
  `);

  await expect(renderUnitElement(<PostPhoto vaultImageId="1234" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <PostPhoto
          vaultImageId="1234"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/photos",
          "file": undefined,
          "params": {
            "backdated_time": undefined,
            "spherical_metadata": undefined,
            "url": undefined,
            "vault_image_id": "1234",
          },
          "type": "post",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <PostPhoto
        url="http://sociably.js/cooool.jpg"
        caption="COOOL"
        allowSphericalPhoto
        backdatedTime={new Date('2022/01/01Z')}
        sphericalMetadata={{
          ProjectionType: 'equirectangular',
          CroppedAreaImageWidthPixels: 123,
        }}
        altTextCustom="COOL"
        feedTargeting={{
          ageMin: 3,
          ageMax: 300,
        }}
        ogIconId={1234}
        place="social media"
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PostPhoto
          allowSphericalPhoto={true}
          altTextCustom="COOL"
          backdatedTime={2022-01-01T00:00:00.000Z}
          caption="COOOL"
          feedTargeting={
            {
              "ageMax": 300,
              "ageMin": 3,
            }
          }
          ogIconId={1234}
          place="social media"
          sphericalMetadata={
            {
              "CroppedAreaImageWidthPixels": 123,
              "ProjectionType": "equirectangular",
            }
          }
          url="http://sociably.js/cooool.jpg"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/photos",
          "file": undefined,
          "params": {
            "allow_spherical_photo": true,
            "alt_text_custom": "COOL",
            "backdated_time": 1640995200,
            "caption": "COOOL",
            "feed_targeting": {
              "age_max": 300,
              "age_min": 3,
            },
            "og_icon_id": 1234,
            "place": "social media",
            "spherical_metadata": {
              "CroppedAreaImageWidthPixels": 123,
              "ProjectionType": "equirectangular",
            },
            "url": "http://sociably.js/cooool.jpg",
            "vault_image_id": undefined,
          },
          "type": "post",
        },
      },
    ]
  `);
});

it('throw if there is no source prop', async () => {
  await expect(
    renderUnitElement(<PostPhoto />),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"There should be exactly one source prop: "url", "file" or "vaultImageId""`,
  );
});

it('throw if multiple source props are set', async () => {
  await expect(
    renderUnitElement(
      <PostPhoto vaultImageId="123" file={{ data: Buffer.from('foo') }} />,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"There should be exactly one source prop: "url", "file" or "vaultImageId""`,
  );
  await expect(
    renderUnitElement(<PostPhoto vaultImageId="123" url="http://..." />),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"There should be exactly one source prop: "url", "file" or "vaultImageId""`,
  );
  await expect(
    renderUnitElement(
      <PostPhoto file={{ data: Buffer.from('foo') }} url="http://..." />,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"There should be exactly one source prop: "url", "file" or "vaultImageId""`,
  );
});
