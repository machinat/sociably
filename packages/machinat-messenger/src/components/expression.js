/* eslint-disable import/prefer-default-export */
import formatNode from '@machinat/core/utils/formatNode';
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

  const segments = [];
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
    } else if (isMessageEntry(value)) {
      if (value.message) {
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

    segments.splice(lastMessageIdx, 1, {
      ...lastMessageSeg,
      value: {
        ...lastMessageSeg.value,
        message: {
          ...lastMessageSeg.value.message,
          metadata,
          quick_replies: quickReplySegments?.map((segment) => segment.value),
        },
      },
    });
  }

  return segments;
};

annotateMessengerComponent(Expression);
