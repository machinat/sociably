/* eslint-disable import/prefer-default-export */
import { MachinatNode, MachinatElement } from '@machinat/core/types';
import type { UnitSegment } from '@machinat/core/renderer/types';
import formatNode from '@machinat/core/utils/formatNode';
import type {
  MessengerSegmentValue,
  MessengerComponent,
  MessageValue,
} from '../types';
import { annotateMessengerComponent, isMessageEntry } from '../utils';

/**
 * @category Props
 */
type ExpressionProps = {
  /** Content nodes to be annotated. */
  children: MachinatNode;
  /**
   * The messaging type of the message being sent. For more information, see
   * [Sending Messages - Messaging Types](https://developers.facebook.com/docs/messenger-platform/send-messages/#messaging_types).
   * Default to 'RESPONSE'.
   */
  messagingType?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
  /**
   * The message tag to use when messagingType set to 'MESSAGE_TAG'. For more
   * information, see [Message Tags](https://developers.facebook.com/docs/messenger-platform/send-messages/message-tags).
   */
  tag?:
    | 'CONFIRMED_EVENT_UPDATE'
    | 'POST_PURCHASE_UPDATE'
    | 'ACCOUNT_UPDATE'
    | 'HUMAN_AGENT';
  /**
   * Push notification type.
   *  REGULAR: sound/vibration
   *  SILENT_PUSH: on-screen notification only
   *  NO_PUSH: no notification
   * Defaults to 'REGULAR'.
   */
  notificationType?: 'REGULAR' | 'SILENT_PUSH' | 'NO_PUSH';
  /**
   * Custom string that is delivered as a message echo. 1000 character limit.
   */
  metadata?: string;
  /** {@link QuickReply} elements to be sent with messages. */
  quickReplies?: MachinatNode;
  /** The persona id to use. */
  personaId?: string;
};

/** @ignore */
const __Expression = async function Expression(
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
  }: MachinatElement<ExpressionProps, any>,
  _path,
  render
) {
  const childrenSegments = await render(children, '.children');
  if (childrenSegments === null) {
    return null;
  }

  const segments: UnitSegment<MessengerSegmentValue>[] = [];
  let lastMessageIdx = -1;

  for (const segment of childrenSegments) {
    if (segment.type === 'part') {
      throw new TypeError(
        `part component ${formatNode(
          segment.node
        )} should not be directly placed in <Expression/>`
      );
    }

    const { type, value, node, path } = segment;

    // hoisting text to message object
    if (type === 'text') {
      lastMessageIdx = segments.length;

      segments.push({
        type: 'unit',
        value: {
          message: { text: value },
          messaging_type: messagingType,
          tag,
          notification_type: notificationType,
          persona_id: personaId,
        },
        node,
        path,
      });
    } else if (isMessageEntry(value as MessengerSegmentValue)) {
      if ('message' in value) {
        lastMessageIdx = segments.length;

        segments.push({
          ...segment,
          value: {
            ...value,
            messaging_type: messagingType,
            tag,
            notification_type: notificationType,
            persona_id: personaId,
          },
        });
      } else if (
        value.sender_action === 'typing_on' ||
        value.sender_action === 'typing_off'
      ) {
        segments.push({
          ...segment,
          value: { ...value, persona_id: personaId },
        });
      } else {
        segments.push(segment);
      }
    } else if (type !== 'break') {
      segments.push(segment);
    }
  }

  //  attach quick_replies and metadata to last message
  if (lastMessageIdx !== -1) {
    const lastMessageSeg = segments[lastMessageIdx];

    const quickReplySegments = await render(quickReplies, '.quickReplies');

    const { value } = lastMessageSeg as UnitSegment<MessengerSegmentValue>;

    segments.splice(lastMessageIdx, 1, {
      ...lastMessageSeg,
      value: {
        ...value,
        message: {
          ...(value as MessageValue).message,
          metadata,
          quick_replies: quickReplySegments?.map((segment) => segment.value),
        },
      },
    });
  }

  return segments;
};

/**
 * Annotate all the children content with the message settings attributes and
 * append quick replies after the content.
 * @category Component
 * @props {@link ExpressionProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const Expression: MessengerComponent<
  ExpressionProps,
  UnitSegment<MessengerSegmentValue>
> = annotateMessengerComponent(__Expression);
