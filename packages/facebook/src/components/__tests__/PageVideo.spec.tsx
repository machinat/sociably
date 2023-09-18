import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { PageVideo } from '../PageVideo.js';

import { renderUnitElement } from './utils.js';

it('is valid root Component', () => {
  expect(isNativeType(<PageVideo />)).toBe(true);
  expect(PageVideo.$$platform).toBe('facebook');
  expect(PageVideo.$$name).toBe('PageVideo');
});

it('match snapshot', async () => {
  await expect(
    renderUnitElement(<PageVideo url="http://sociably.js/yoyoyo.mp4" />),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PageVideo
          url="http://sociably.js/yoyoyo.mp4"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/videos",
          "file": undefined,
          "params": {
            "backdated_post": undefined,
            "file_size": undefined,
            "url": "http://sociably.js/yoyoyo.mp4",
          },
          "thumbnailFile": undefined,
          "type": "page",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <PageVideo file={{ data: Buffer.from('🤟'), contentLength: 4 }} />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PageVideo
          file={
            {
              "contentLength": 4,
              "data": {
                "data": [
                  240,
                  159,
                  164,
                  159,
                ],
                "type": "Buffer",
              },
            }
          }
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/videos",
          "file": {
            "contentLength": 4,
            "data": {
              "data": [
                240,
                159,
                164,
                159,
              ],
              "type": "Buffer",
            },
          },
          "params": {
            "backdated_post": undefined,
            "file_size": 4,
            "url": undefined,
          },
          "thumbnailFile": undefined,
          "type": "page",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <PageVideo
        url="http://sociably.js/rocknroll.mp4"
        title="LET'S ROCK 🤟"
        socialActions
        targeting={{
          geoLocations: {
            countries: ['heaven', 'california'],
          },
          ageMin: 13,
        }}
        backdatedPost={{
          backdatedTime: new Date('2022Z'),
          backdatedTimeGranularity: 'month',
        }}
        thumbnailFile={{ data: Buffer.from('🤘') }}
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PageVideo
          backdatedPost={
            {
              "backdatedTime": 2022-01-01T00:00:00.000Z,
              "backdatedTimeGranularity": "month",
            }
          }
          socialActions={true}
          targeting={
            {
              "ageMin": 13,
              "geoLocations": {
                "countries": [
                  "heaven",
                  "california",
                ],
              },
            }
          }
          thumbnailFile={
            {
              "data": {
                "data": [
                  240,
                  159,
                  164,
                  152,
                ],
                "type": "Buffer",
              },
            }
          }
          title="LET'S ROCK 🤟"
          url="http://sociably.js/rocknroll.mp4"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/videos",
          "file": undefined,
          "params": {
            "backdated_post": {
              "backdated_time": 1640995200,
              "backdated_time_granularity": "month",
            },
            "file_size": undefined,
            "social_actions": true,
            "targeting": {
              "age_min": 13,
              "geo_locations": {
                "countries": [
                  "heaven",
                  "california",
                ],
              },
            },
            "title": "LET'S ROCK 🤟",
            "url": "http://sociably.js/rocknroll.mp4",
          },
          "thumbnailFile": {
            "data": {
              "data": [
                240,
                159,
                164,
                152,
              ],
              "type": "Buffer",
            },
          },
          "type": "page",
        },
      },
    ]
  `);
});

it('throw if there is no source prop', async () => {
  await expect(
    renderUnitElement(<PageVideo />),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"There should be exactly one source prop: "url" or "file""`,
  );
});

it('throw if multiple source props are set', async () => {
  await expect(
    renderUnitElement(
      <PageVideo
        file={{ data: Buffer.from('foo'), contentLength: 3 }}
        url="http://..."
      />,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"There should be exactly one source prop: "url" or "file""`,
  );
});
