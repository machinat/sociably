/* eslint-disable import/prefer-default-export */
import { valuesOfAssertedTypes } from 'machinat-utility';
import { asContainerComponent, isMessageValue } from '../utils';
import { QuickReply } from './quickReply';

const getQuickReplyValues = valuesOfAssertedTypes(() => [QuickReply]);

const Dialog = async ({ props: { children, quickReplies } }, render) => {
  const segments = await render(children, '.children');
  if (segments === null) {
    return null;
  }

  let lastMessageIdx = -1;
  // hoisting text to line text message object
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    const { type, value } = segment;

    if (type === 'text') {
      segment.type = 'unit';
      segment.value = {
        type: 'text',
        text: value,
      };
    }

    if (isMessageValue(value)) {
      lastMessageIdx = i;
    }
  }

  const quickReplySegments = await render(quickReplies, '.quickReplies');
  const quickRepliesValues = getQuickReplyValues(quickReplySegments);

  if (quickRepliesValues && lastMessageIdx !== -1) {
    segments[lastMessageIdx].value.quickReply = {
      items: quickRepliesValues,
    };
  }

  return segments;
};

const __Dialog = asContainerComponent(Dialog);

export { __Dialog as Dialog };
