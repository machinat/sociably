import type { UniqueOmniIdentifier } from '@sociably/core';
import { MessengerChat } from '@sociably/messenger';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import InstagramPage from './Page.js';
import { INSTAGRAM, IG } from './constant.js';
import type { MessagingTarget } from './types.js';

type InstagramChatType = 'user' | 'comment' | 'unknown';

type ChatValue = {
  page: string;
  target: MessagingTarget;
};

class InstagramChat implements MessengerChat, MarshallableInstance<ChatValue> {
  static typeName = 'IgChat';
  static fromJSONValue(value: ChatValue): InstagramChat {
    const { page, target } = value;
    return new InstagramChat(page, target);
  }

  pageId: string;
  target: MessagingTarget;

  readonly platform = INSTAGRAM;
  readonly $$typeofThread = true;

  constructor(pageId: string, target: MessagingTarget) {
    this.pageId = pageId;
    this.target = target;
  }

  get type(): InstagramChatType {
    const { target } = this;

    return 'id' in target
      ? 'user'
      : 'comment_id' in target
      ? 'comment'
      : 'unknown';
  }

  get id(): string {
    const target = this.target as Record<string, undefined | string>;
    return (
      target.id || target.user_ref || target.post_id || target.comment_id || '-'
    );
  }

  get page(): InstagramPage {
    return new InstagramPage(this.pageId);
  }

  get agent(): InstagramPage {
    return this.page;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      $$typeof: ['thread'],
      platform: INSTAGRAM,
      scopeId: this.pageId,
      id: this.id,
    };
  }

  get uid(): string {
    return `${IG}.${this.pageId}.${this.id}`;
  }

  toJSONValue(): ChatValue {
    const { pageId, target } = this;
    return { page: pageId, target };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return InstagramChat.typeName;
  }
}

export default InstagramChat;
