import { SociablyNode } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent.js';
import { PATH_PHOTOS } from '../constant.js';
import type {
  FacebookComponent,
  CommentValue,
  PostPhotoValue,
} from '../types.js';

export type CommentProps = {
  /**
   * The comment text. Mention other Facebook Pages in your message text using
   * the following syntax: @[page-id]. Usage of this feature is subject to
   * review.
   */
  children?: SociablyNode;
  /** A PostPhoto element to be attached with the comment */
  photo?: SociablyNode;
  /** The URL of an image to include as a photo comment. */
  gifShareUrl?: string;
};

/**
 * Comment on a Facebook instance
 *
 * @category Component
 * @props {@link CommentProps}
 * @guides Check official [reference](https://developers.facebook.com/docs/graph-api/reference/v15.0/object/comments).
 */
export const Comment: FacebookComponent<
  CommentProps,
  UnitSegment<CommentValue>
> = makeFacebookComponent(async function Comment(node, path, render) {
  const { children, photo, gifShareUrl } = node.props;
  const [messageSegments, photoSegments] = await Promise.all([
    render(children, '.children'),
    render<PostPhotoValue, never>(photo, '.photo'),
  ]);

  if (
    messageSegments &&
    (messageSegments.length > 1 || messageSegments[0].type !== 'text')
  ) {
    throw new TypeError('"children" prop should contain only textual content');
  }
  if (photoSegments) {
    const [photoSeg] = photoSegments;
    if (
      photoSegments.length > 1 ||
      (photoSeg.type !== 'unit' && photoSeg.type !== 'raw') ||
      photoSeg.value.type !== 'post' ||
      photoSeg.value.apiPath !== PATH_PHOTOS
    ) {
      throw new TypeError(
        '"photo" should contain exactly one <PostPhoto/> element',
      );
    }
  }
  if (!messageSegments && !photoSegments && !gifShareUrl) {
    throw new TypeError(
      'there should be at least one of "children", "photo" or "gifShareUrl" prop',
    );
  }
  if (photoSegments && gifShareUrl) {
    throw new TypeError(
      '"photo" and "gifShareUrl" props can\'t be set together',
    );
  }

  return [
    makeUnitSegment(node, path, {
      type: 'comment',
      params: {
        attachment_share_url: gifShareUrl,
        message: messageSegments?.[0].value,
      },
      photo: photoSegments?.[0].value as undefined | PostPhotoValue,
    }),
  ];
});
