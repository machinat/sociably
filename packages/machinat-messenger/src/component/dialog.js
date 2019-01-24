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
  const actions = render(children, '.children');
  if (actions === null) {
    return null;
  }

  let lastMessageIdx = -1;

  for (let i = 0; i < actions.length; i += 1) {
    const action = actions[i];

    // hoisting text to message object
    if (typeof action.value === 'string') {
      action.value = {
        message: {
          text: action.value,
        },
      };
    }

    const { value } = action;
    value.messaging_type = type;
    value.tag = tag;
    value.notification_type = notificationType;
    value.persona_id = personaId;

    if (value.message) lastMessageIdx = i;
  }

  // only attach quick_replies and metadata to last message action
  if (lastMessageIdx !== -1) {
    const {
      value: { message },
    } = actions[lastMessageIdx];

    message.metadata = metadata;
    message.quick_replies = renderQuickRepliesValues(
      quickReplies,
      render,
      '.quickReplies'
    );
  }

  return actions;
};

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(true), asContainer(true))(
  Dialog
);
