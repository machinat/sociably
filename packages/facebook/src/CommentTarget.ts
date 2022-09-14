import type { SociablyChannel } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { FACEBOOK } from './constant';

type CommentTargetValue = {
  page: string;
  id: string;
};

class FacebookCommentTarget
  implements SociablyChannel, MarshallableInstance<CommentTargetValue>
{
  static typeName = 'FacebookCommentTarget';
  static fromJSONValue({
    page,
    id,
  }: CommentTargetValue): FacebookCommentTarget {
    return new FacebookCommentTarget(page, id);
  }

  pageId: string;
  id: string;
  platform = FACEBOOK;

  constructor(pageId: string, id: string) {
    this.pageId = pageId;
    this.id = id;
  }

  get uid(): string {
    return `${FACEBOOK}.${this.pageId}.${this.id}`;
  }

  toJSONValue(): CommentTargetValue {
    const { pageId, id } = this;
    return { page: pageId, id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return FacebookCommentTarget.typeName;
  }
}

export default FacebookCommentTarget;
