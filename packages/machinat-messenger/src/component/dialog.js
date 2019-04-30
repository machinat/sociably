/* eslint-disable import/prefer-default-export */
import {
  annotate,
  asNative,
  asUnit,
  asContainer,
  valuesOfAssertedType,
} from 'machinat-utility';

import { MESSENGER_NAITVE_TYPE } from '../symbol';
import * as quickReply from './quickReply';

const replyComponents = Object.values(quickReply);
const renderQuickRepliesValues = valuesOfAssertedType(...replyComponents);

export const Dialog = (
  { children, type, tag, notificationType, metadata, quickReplies, personaId },
  render
) => {
  const segments = render(children, '.children');
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
    message.quick_replies = renderQuickRepliesValues(
      quickReplies,
      render,
      '.quickReplies'
    );

    value.message = message;
  }

  return segments;
};

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(true), asContainer(true))(
  Dialog
);
