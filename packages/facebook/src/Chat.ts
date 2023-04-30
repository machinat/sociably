import type { SociablyThread, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import FacebookPage from './Page';
import { FACEBOOK, FB } from './constant';
import type { MessagingTarget } from './types';

type ChatValue = {
  page: string;
  target: MessagingTarget;
};

type ChatType = 'user' | 'user_ref' | 'comment' | 'post';

class FacebookChat<Type extends ChatType = ChatType>
  implements SociablyThread, MarshallableInstance<ChatValue>
{
  static typeName = 'FbChat';
  static fromJSONValue<Type extends ChatType = ChatType>(
    value: ChatValue
  ): FacebookChat<Type> {
    const { page, target } = value;
    return new FacebookChat(page, target);
  }

  pageId: string;
  target: MessagingTarget;
  platform = FACEBOOK;

  constructor(pageId: string, target: MessagingTarget) {
    this.pageId = pageId;
    this.target = target;
  }

  get type(): Type {
    const { target } = this;

    return (
      'id' in target
        ? 'user'
        : 'user_ref' in target
        ? 'user_ref'
        : 'post_id' in target
        ? 'post'
        : 'comment_id' in target
        ? 'comment'
        : 'unknown'
    ) as Type;
  }

  get id(): string {
    const target = this.target as Record<string, undefined | string>;
    return (
      target.id || target.user_ref || target.post_id || target.comment_id || '-'
    );
  }

  get page(): FacebookPage {
    return new FacebookPage(this.pageId);
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: FACEBOOK,
      scopeId: this.pageId,
      id: this.id,
    };
  }

  get uid(): string {
    return `${FB}.${this.pageId}.${this.id}`;
  }

  toJSONValue(): ChatValue {
    const { pageId, target } = this;
    return { page: pageId, target };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return FacebookChat.typeName;
  }
}

export default FacebookChat;
