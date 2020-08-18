/* eslint-disable import/prefer-default-export */
import type { UnitSegment } from '@machinat/core/renderer/types';
import formatNode from '@machinat/core/utils/formatNode';
import type { MessengerSegmentValue, MessageValue } from '../types';
import { annotateMessengerComponent, isMessageEntry } from '../utils';

export const Expression = async (
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
  },
  _path,
  render
) => {
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

    const { value } = lastMessageSeg as UnitSegment<MessageValue>;

    segments.splice(lastMessageIdx, 1, {
      ...lastMessageSeg,
      value: {
        ...value,
        message: {
          ...value.message,
          metadata,
          quick_replies: quickReplySegments?.map((segment) => segment.value),
        },
      },
    });
  }

  return segments;
};

annotateMessengerComponent(Expression);
