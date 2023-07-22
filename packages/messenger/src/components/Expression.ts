import type {
  SociablyNode,
  NativeElement,
  AnyNativeComponent,
} from '@sociably/core';
import type {
  UnitSegment,
  OutputSegment,
  InnerRenderFn,
} from '@sociably/core/renderer';
import { formatNode } from '@sociably/core/utils';
import { PATH_MESSAGES } from '../constant.js';
import type {
  MessageValue,
  SenderActionValue,
  MessengerSegmentValue,
  MessagingType,
  MessageTags,
  NotificationType,
} from '../types.js';

/**
 * @category Props
 */
export type ExpressionProps = {
  /** Content nodes to be annotated. */
  children: SociablyNode;
  /**
   * The messaging type of the message being sent. For more information, see
   * [Sending Messages - Messaging Types](https://developers.facebook.com/docs/messenger-platform/send-messages/#messaging_types).
   * Default to 'RESPONSE'.
   */
  messagingType?: MessagingType;
  /**
   * The message tag to use when messagingType set to 'MESSAGE_TAG'. For more
   * information, see [Message Tags](https://developers.facebook.com/docs/messenger-platform/send-messages/message-tags).
   */
  tag?: MessageTags;
  /**
   * Push notification type.
   *  REGULAR: sound/vibration
   *  SILENT_PUSH: on-screen notification only
   *  NO_PUSH: no notification
   * Defaults to 'REGULAR'.
   */
  notificationType?: NotificationType;
  /**
   * Custom string that is delivered as a message echo. 1000 character limit.
   */
  metadata?: string;
  /** {@link QuickReply} elements to be sent with messages. */
  quickReplies?: SociablyNode;
  /** The persona id to use. */
  personaId?: string;
};

export async function Expression(
  {
    props: {
      children,
      messagingType,
      tag,
      notificationType,
      metadata,
      quickReplies,
      personaId,
    },
  }: NativeElement<ExpressionProps, AnyNativeComponent>,
  path: string,
  render: InnerRenderFn
): Promise<null | OutputSegment<MessengerSegmentValue>[]> {
  const [childrenSegments, quickReplySegments] = await Promise.all([
    render<MessengerSegmentValue>(children, '.children'),
    render(quickReplies, '.quickReplies'),
  ]);

  if (childrenSegments === null) {
    return null;
  }

  const segments: OutputSegment<MessengerSegmentValue>[] = [];
  let lastMessageIdx = -1;

  for (const segment of childrenSegments) {
    if (segment.type === 'part') {
      throw new TypeError(
        `${formatNode(segment.node)} can not be placed in <Expression/>`
      );
    }

    // hoisting text to message object
    if (segment.type === 'text') {
      lastMessageIdx = segments.length;

      segments.push({
        type: 'unit',
        value: {
          type: 'message',
          apiPath: PATH_MESSAGES,
          params: {
            message: { text: segment.value },
            messaging_type: messagingType,
            tag,
            notification_type: notificationType,
            persona_id: personaId,
          },
        },
        node: segment.node,
        path: segment.path,
      });
    } else if (segment.type === 'unit' || segment.type === 'raw') {
      const { value } = segment;
      if (value.type !== 'message') {
        throw new TypeError(
          `${formatNode(segment.node)} can not be placed in <Expression/>`
        );
      }

      if (value.apiPath === PATH_MESSAGES && 'message' in value.params) {
        lastMessageIdx = segments.length;

        segments.push({
          ...segment,
          value: {
            ...value,
            params: {
              ...value.params,
              messaging_type: messagingType,
              tag,
              notification_type: notificationType,
              persona_id: personaId,
            },
          },
        });
      } else if (
        value.apiPath === PATH_MESSAGES &&
        'sender_action' in value.params &&
        (value.params.sender_action === 'typing_on' ||
          value.params.sender_action === 'typing_off')
      ) {
        segments.push({
          ...segment,
          value: {
            ...(value as SenderActionValue),
            params: { ...value.params, persona_id: personaId },
          },
        });
      } else {
        segments.push(segment as UnitSegment<MessengerSegmentValue>);
      }
    } else if (segment.type !== 'break') {
      segments.push(segment);
    }
  }

  //  attach quick_replies and metadata to last message
  if (lastMessageIdx !== -1) {
    const lastMessageSeg = segments[
      lastMessageIdx
    ] as UnitSegment<MessageValue>;

    const { value } = lastMessageSeg;

    segments.splice(lastMessageIdx, 1, {
      ...lastMessageSeg,
      value: {
        ...value,
        params: {
          ...value.params,
          message: {
            ...value.params.message,
            metadata,
            quick_replies: quickReplySegments?.map((segment) => segment.value),
          },
        },
      },
    });
  }

  return segments;
}
