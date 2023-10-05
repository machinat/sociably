import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { PostPhoto } from '../PostPhoto.js';
import { Post } from '../Post.js';

import { renderUnitElement } from './utils.js';

it('is valid root Component', () => {
  expect(isNativeType(<Post />)).toBe(true);
  expect(Post.$$platform).toBe('facebook');
  expect(Post.$$name).toBe('Post');
});

it('match snapshot', async () => {
  await expect(renderUnitElement(<Post>HELLO WORLD</Post>)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <Post>
          HELLO WORLD
        </Post>,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/feed",
          "file": undefined,
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
          "type": "post",
        },
      },
    ]
  `);

  await expect(renderUnitElement(<Post link="https://sociably.js.org" />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Post
          link="https://sociably.js.org"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/feed",
          "file": undefined,
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
          "type": "post",
        },
      },
    ]
  `);

  await expect(renderUnitElement(<Post objectAttachment="1234" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <Post
          objectAttachment="1234"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/feed",
          "file": undefined,
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
          "type": "post",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <Post photos={<PostPhoto url="https://sociably.js.org/logo.png" />} />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Post
          photos={
            <PostPhoto
              url="https://sociably.js.org/logo.png"
            />
          }
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/feed",
          "file": undefined,
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
              "file": undefined,
              "params": {
                "backdated_time": undefined,
                "spherical_metadata": undefined,
                "url": "https://sociably.js.org/logo.png",
                "vault_image_id": undefined,
              },
              "type": "post",
            },
          ],
          "type": "post",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <Post
        link="http://sociably.js"
        linkAttachment={{
          name: 'Sociably',
          description: 'is awesome',
          thumbnailUrl: 'http://sociably.js/logo.png',
          thumbnailFile: { data: Buffer.from('👍') },
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
      </Post>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Post
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
              "thumbnailFile": {
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
              "thumbnailUrl": "http://sociably.js/logo.png",
            }
          }
          multiShareEndCard={true}
          place="social media"
          scheduledPublishTime={2022-10-10T00:00:00.000Z}
        >
          HELLO SOCIAL MEDIA
        </Post>,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/feed",
          "file": {
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
          "type": "post",
        },
      },
    ]
  `);
});

it('throw if there is no content prop', async () => {
  await expect(
    renderUnitElement(<Post />),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"At least one of "link", "message", "photos" or "objectAttachment" prop must be be set"`,
  );
});

it('throw if "children" prop contain non texual content', async () => {
  await expect(
    renderUnitElement(
      <Post>
        <Sociably.Pause />
      </Post>,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""children" prop should contain only texual content"`,
  );

  await expect(
    renderUnitElement(
      <Post>
        <PostPhoto url="http://..." />
      </Post>,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""children" prop should contain only texual content"`,
  );
});

it('throw if "photo" prop contain non PostPhoto content', async () => {
  await expect(
    renderUnitElement(<Post photos={<Sociably.Pause />} />),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""photos" prop should contain only PostPhoto elements"`,
  );

  await expect(
    renderUnitElement(<Post photos={<>foo</>} />),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""photos" prop should contain only PostPhoto elements"`,
  );
});
