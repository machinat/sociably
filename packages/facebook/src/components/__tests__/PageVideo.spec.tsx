import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { PageVideo } from '../PageVideo';

import { renderUnitElement } from './utils';

it('is valid root Component', () => {
  expect(typeof PageVideo).toBe('function');
  expect(isNativeType(<PageVideo />)).toBe(true);
  expect(PageVideo.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(
    renderUnitElement(<PageVideo url="http://sociably.js/yoyoyo.mp4" />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <PageVideo
                url="http://sociably.js/yoyoyo.mp4"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "apiPath": "me/videos",
                "attachFile": undefined,
                "params": Object {
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

  await expect(renderUnitElement(<PageVideo fileData={Buffer.from('🤟')} />))
    .resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <PageVideo
                fileData={
                  Object {
                    "data": Array [
                      240,
                      159,
                      164,
                      159,
                    ],
                    "type": "Buffer",
                  }
                }
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "apiPath": "me/videos",
                "attachFile": Object {
                  "data": Object {
                    "data": Array [
                      240,
                      159,
                      164,
                      159,
                    ],
                    "type": "Buffer",
                  },
                  "info": Object {
                    "knownLength": undefined,
                  },
                },
                "params": Object {
                  "backdated_post": undefined,
                  "file_size": undefined,
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
        thumbnailData={Buffer.from('🤘')}
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <PageVideo
                backdatedPost={
                  Object {
                    "backdatedTime": 2022-01-01T00:00:00.000Z,
                    "backdatedTimeGranularity": "month",
                  }
                }
                socialActions={true}
                targeting={
                  Object {
                    "ageMin": 13,
                    "geoLocations": Object {
                      "countries": Array [
                        "heaven",
                        "california",
                      ],
                    },
                  }
                }
                thumbnailData={
                  Object {
                    "data": Array [
                      240,
                      159,
                      164,
                      152,
                    ],
                    "type": "Buffer",
                  }
                }
                title="LET'S ROCK 🤟"
                url="http://sociably.js/rocknroll.mp4"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "apiPath": "me/videos",
                "attachFile": undefined,
                "params": Object {
                  "backdated_post": Object {
                    "backdated_time": 1640995200,
                    "backdated_time_granularity": "month",
                  },
                  "file_size": undefined,
                  "social_actions": true,
                  "targeting": Object {
                    "age_min": 13,
                    "geo_locations": Object {
                      "countries": Array [
                        "heaven",
                        "california",
                      ],
                    },
                  },
                  "title": "LET'S ROCK 🤟",
                  "url": "http://sociably.js/rocknroll.mp4",
                },
                "thumbnailFile": Object {
                  "data": Object {
                    "data": Array [
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
    renderUnitElement(<PageVideo />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"There should be exactly one source prop: \\"url\\" or \\"fileData\\""`
  );
});

it('throw if multiple source props are set', async () => {
  await expect(
    renderUnitElement(
      <PageVideo fileData={Buffer.from('foo')} url="http://..." />
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"There should be exactly one source prop: \\"url\\" or \\"fileData\\""`
  );
});
