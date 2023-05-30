import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { PagePhoto } from '../PagePhoto.js';
import { Comment } from '../Comment.js';
import { renderUnitElement } from './utils.js';

it('is valid root Component', () => {
  expect(typeof Comment).toBe('function');
  expect(isNativeType(<Comment />)).toBe(true);
  expect(Comment.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(renderUnitElement(<Comment>hello world</Comment>)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <Comment>
          hello world
        </Comment>,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "attachment_share_url": undefined,
            "message": "hello world",
          },
          "photo": undefined,
          "type": "comment",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <Comment photo={<PagePhoto url="http://sociably.js/good.jpg" />} />
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Comment
          photo={
            <PagePhoto
              url="http://sociably.js/good.jpg"
            />
          }
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "attachment_share_url": undefined,
            "message": undefined,
          },
          "photo": {
            "apiPath": "me/photos",
            "attachFile": undefined,
            "params": {
              "backdated_time": undefined,
              "spherical_metadata": undefined,
              "url": "http://sociably.js/good.jpg",
              "vault_image_id": undefined,
            },
            "type": "page",
          },
          "type": "comment",
        },
      },
    ]
  `);

  await expect(
    renderUnitElement(
      <Comment gifShareUrl="http://sociably.js/cool.gif">
        ハロー ワールド
      </Comment>
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Comment
          gifShareUrl="http://sociably.js/cool.gif"
        >
          ハロー ワールド
        </Comment>,
        "path": "$",
        "type": "unit",
        "value": {
          "params": {
            "attachment_share_url": "http://sociably.js/cool.gif",
            "message": "ハロー ワールド",
          },
          "photo": undefined,
          "type": "comment",
        },
      },
    ]
  `);
});

it('throw if comment is empty', async () => {
  await expect(
    renderUnitElement(<Comment />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"there should be at least one of "children", "photo" or "gifShareUrl" prop"`
  );
});

it('throw if gifShareUrl and photo props exist at the same time', async () => {
  await expect(
    renderUnitElement(
      <Comment
        photo={<PagePhoto />}
        gifShareUrl="http://sociably.js/unblievable.gif"
      />
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"There should be exactly one source prop: "url", "fileData" or "vaultImageId""`
  );
});

it('throw if photo prop contain non PagePhoto content', async () => {
  await expect(
    renderUnitElement(<Comment photo={<>foo</>} />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""photo" should contain exactly one <PagePhoto/> element"`
  );

  await expect(
    renderUnitElement(<Comment photo={<Sociably.Pause />} />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""photo" should contain exactly one <PagePhoto/> element"`
  );
});
