/* eslint-disable import/prefer-default-export */
import { valuesOfAssertedType } from 'machinat-utility';
import { asContainerComponent } from './utils';
import { QuickReply } from './quickReply';

const renderQuickReplyValues = valuesOfAssertedType(QuickReply);

const Dialog = ({ props: { children, quickReplies } }, render) => {
  const segments = render(children, '.children');
  if (segments === null) {
    return null;
  }

  let lastMessageIdx = -1;
  // hoisting text to line text message object
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    const { type, node, value } = segment;

    if (type === 'text') {
      segment.type = 'unit';
      segment.value = {
        type: 'text',
        text: value,
      };
    }

    if (
      typeof node !== 'object' ||
      typeof node.type.$$getEntry !== 'function'
    ) {
      lastMessageIdx = i;
    }
  }

  const quickRepliesValues = renderQuickReplyValues(
    render(quickReplies, '.quickReplies')
  );

  if (quickRepliesValues && lastMessageIdx !== -1) {
    segments[lastMessageIdx].value.quickReply = {
      items: quickRepliesValues,
    };
  }

  return segments;
};

const __Dialog = asContainerComponent(Dialog);

export { __Dialog as Dialog };
