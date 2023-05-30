import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { PagePhoto } from '../PagePhoto.js';
import { PagePost } from '../PagePost.js';

import { renderUnitElement } from './utils.js';

it('is valid root Component', () => {
  expect(typeof PagePost).toBe('function');
  expect(isNativeType(<PagePost />)).toBe(true);
  expect(PagePost.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(renderUnitElement(<PagePost>HELLO WORLD</PagePost>)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <PagePost>
          HELLO WORLD
        </PagePost>,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/feed",
          "attachFile": undefined,
          "params": {
            "backdated_time": undefined,
            "description": undefined,
            "link": undefined,
            "message": "HELLO WORLD",
            "name": undefined,
            "object_attachment": undefined,
            "picture": undefined,
            "scheduled_publish_time": undefined,
          },
          "photos": undefined,
          "type": "page",
        },
      },
    ]
  `);

  await expect(renderUnitElement(<PagePost link="https://sociably.js.org" />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PagePost
          link="https://sociably.js.org"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/feed",
          "attachFile": undefined,
          "params": {
            "backdated_time": undefined,
            "description": undefined,
            "link": "https://sociably.js.org",
            "message": undefined,
            "name": undefined,
            "object_attachment": undefined,
            "picture": undefined,
            "scheduled_publish_time": undefined,
          },
          "photos": undefined,
          "type": "page",
        },
      },
    ]
  `);

  await expect(renderUnitElement(<PagePost objectAttachment="1234" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <PagePost
          objectAttachment="1234"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/feed",
          "attachFile": undefined,
          "params": {
            "backdated_time": undefined,
            "description": undefined,
            "link": undefined,
            "message": undefined,
            "name": undefined,
            "object_attachment": "1234",
            "picture": undefined,
            "scheduled_publish_time": undefined,
          },
          "photos": undefined,
          "type": "page",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <PagePost photos={<PagePhoto url="https://sociably.js.org/logo.png" />} />
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PagePost
          photos={
            <PagePhoto
              url="https://sociably.js.org/logo.png"
            />
          }
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/feed",
          "attachFile": undefined,
          "params": {
            "backdated_time": undefined,
            "description": undefined,
            "link": undefined,
            "message": undefined,
            "name": undefined,
            "object_attachment": undefined,
            "picture": undefined,
            "scheduled_publish_time": undefined,
          },
          "photos": [
            {
              "apiPath": "me/photos",
              "attachFile": undefined,
              "params": {
                "backdated_time": undefined,
                "spherical_metadata": undefined,
                "url": "https://sociably.js.org/logo.png",
                "vault_image_id": undefined,
              },
              "type": "page",
            },
          ],
          "type": "page",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <PagePost
        link="http://sociably.js"
        linkAttachment={{
          name: 'Sociably',
          description: 'is awesome',
          thumbnailUrl: 'http://sociably.js/logo.png',
          thumbnailData: Buffer.from('👍'),
        }}
        backdatedTime={new Date('2022Z')}
        scheduledPublishTime={new Date('2022/10/10Z')}
        place="social media"
        childAttachments={[
          { link: 'http://sociably.js/api', name: 'API Ref' },
          { link: 'http://sociably.js/doc', name: 'Document' },
        ]}
        feedTargeting={{ ageMin: 13, ageMax: 100 }}
        multiShareEndCard
      >
        HELLO SOCIAL MEDIA
      </PagePost>
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PagePost
          backdatedTime={2022-01-01T00:00:00.000Z}
          childAttachments={
            [
              {
                "link": "http://sociably.js/api",
                "name": "API Ref",
              },
              {
                "link": "http://sociably.js/doc",
                "name": "Document",
              },
            ]
          }
          feedTargeting={
            {
              "ageMax": 100,
              "ageMin": 13,
            }
          }
          link="http://sociably.js"
          linkAttachment={
            {
              "description": "is awesome",
              "name": "Sociably",
              "thumbnailData": {
                "data": [
                  240,
                  159,
                  145,
                  141,
                ],
                "type": "Buffer",
              },
              "thumbnailUrl": "http://sociably.js/logo.png",
            }
          }
          multiShareEndCard={true}
          place="social media"
          scheduledPublishTime={2022-10-10T00:00:00.000Z}
        >
          HELLO SOCIAL MEDIA
        </PagePost>,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/feed",
          "attachFile": {
            "data": {
              "data": [
                240,
                159,
                145,
                141,
              ],
              "type": "Buffer",
            },
          },
          "params": {
            "backdated_time": 1640995200,
            "child_attachments": [
              {
                "link": "http://sociably.js/api",
                "name": "API Ref",
              },
              {
                "link": "http://sociably.js/doc",
                "name": "Document",
              },
            ],
            "description": "is awesome",
            "feed_targeting": {
              "age_max": 100,
              "age_min": 13,
            },
            "link": "http://sociably.js",
            "message": "HELLO SOCIAL MEDIA",
            "multi_share_end_card": true,
            "name": "Sociably",
            "object_attachment": undefined,
            "picture": "http://sociably.js/logo.png",
            "place": "social media",
            "scheduled_publish_time": 1665360000,
          },
          "photos": undefined,
          "type": "page",
        },
      },
    ]
  `);
});

it('throw if there is no content prop', async () => {
  await expect(
    renderUnitElement(<PagePost />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"At least one of "link", "message", "photos" or "objectAttachment" prop must be be set"`
  );
});

it('throw if "children" prop contain non texual content', async () => {
  await expect(
    renderUnitElement(
      <PagePost>
        <Sociably.Pause />
      </PagePost>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""children" prop should contain only texual content"`
  );

  await expect(
    renderUnitElement(
      <PagePost>
        <PagePhoto url="http://..." />
      </PagePost>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""children" prop should contain only texual content"`
  );
});

it('throw if "photo" prop contain non PagePhoto content', async () => {
  await expect(
    renderUnitElement(<PagePost photos={<Sociably.Pause />} />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""photos" prop should contain only PagePhoto elements"`
  );

  await expect(
    renderUnitElement(<PagePost photos={<>foo</>} />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""photos" prop should contain only PagePhoto elements"`
  );
});
