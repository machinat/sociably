/* eslint-disable import/prefer-default-export */
import { valuesOfAssertedType } from 'machinat-utility';

import { asContainerComponent } from '../utils';
import * as quickReply from './quickReply';

const replyComponents = Object.values(quickReply);
const getQuickRepliesValues = valuesOfAssertedType(...replyComponents);

const Dialog = async (
  {
    props: {
      children,
      type,
      tag,
      notificationType,
      metadata,
      quickReplies,
      personaId,
    },
  },
  render
) => {
  const segments = await render(children, '.children');
  if (segments === null) {
    return null;
  }

  let lastMessageIdx = -1;

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];

    // hoisting text to message object
    if (typeof segment.value === 'string') {
      segment.value = {
        message: {
          text: segment.value,
        },
      };
    }

    const { value } = segment;

    if (value.message) {
      const copied = { ...value };

      copied.messaging_type = type;
      copied.tag = tag;
      copied.notification_type = notificationType;
      copied.persona_id = personaId;

      segment.value = copied;
      lastMessageIdx = i;
    }
  }

  // only attach quick_replies and metadata to last message segment
  if (lastMessageIdx !== -1) {
    const { value } = segments[lastMessageIdx];

    const message = { ...value.message };
    message.metadata = metadata;

    const quickReplySegments = await render(quickReplies, '.quickReplies');
    message.quick_replies = getQuickRepliesValues(quickReplySegments);

    value.message = message;
  }

  return segments;
};

const __Dialog = asContainerComponent(Dialog);

export { __Dialog as Dialog };
