/* eslint-disable import/prefer-default-export */
import { annotateMessengerComponent, isMessageEntry } from '../utils';

export const Utterance = async (
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
  path,
  render
) => {
  const childrenSegments = await render(children, '.children');
  if (childrenSegments === null) {
    return null;
  }

  let lastMessageIdx = -1;

  for (let i = 0; i < childrenSegments.length; i += 1) {
    const segment = childrenSegments[i];

    // hoisting text to message object
    if (segment.type === 'text') {
      segment.type = 'unit';
      segment.value = {
        message: {
          text: segment.value,
        },
      };
    }

    const { value } = segment;

    if (isMessageEntry(value)) {
      const copied = { ...value };

      if (value.message) {
        copied.messaging_type = messagingType;
        copied.tag = tag;
        copied.notification_type = notificationType;
        copied.persona_id = personaId;

        lastMessageIdx = i;
      } else if (
        value.sender_action === 'typing_on' ||
        value.sender_action === 'typing_off'
      ) {
        copied.persona_id = personaId;
      }

      segment.value = copied;
    }
  }

  //  attach quick_replies and metadata to last message segment
  if (lastMessageIdx !== -1) {
    const { value } = childrenSegments[lastMessageIdx];

    const message = { ...value.message };
    message.metadata = metadata;

    const quickReplySegments = await render(quickReplies, '.quickReplies');
    message.quick_replies = quickReplySegments?.map((segment) => segment.value);

    value.message = message;
  }

  return childrenSegments;
};
annotateMessengerComponent(Utterance);
