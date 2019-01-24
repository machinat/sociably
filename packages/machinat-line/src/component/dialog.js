/* eslint-disable import/prefer-default-export */
import {
  annotate,
  asNative,
  asUnit,
  asContainer,
  valuesOfAssertedType,
} from 'machinat-utility';

import { LINE_NAITVE_TYPE } from '../symbol';

import { QuickReply } from './quickReply';

const renderQuickReplyValues = valuesOfAssertedType(QuickReply);

export const Dialog = ({ children, quickReplies }, render) => {
  const contentActs = render(children, '.children');
  if (contentActs === null) {
    return null;
  }

  let lastMessageIdx = -1;
  // hoisting text to line text message object
  for (let i = 0; i < contentActs.length; i += 1) {
    const { element, value } = contentActs[i];
    const valueType = typeof value;

    if (valueType === 'string') {
      contentActs[i].value = {
        type: 'text',
        text: valueType === 'string' ? value : String(value),
      };
    }

    if (
      typeof element !== 'object' ||
      typeof element.type.$$entry !== 'function'
    ) {
      lastMessageIdx = i;
    }
  }

  const quickRepliesValues = renderQuickReplyValues(
    quickReplies,
    render,
    '.quickReplies'
  );

  if (quickRepliesValues && lastMessageIdx !== -1) {
    contentActs[lastMessageIdx].value.quickReply = {
      items: quickRepliesValues,
    };
  }

  return contentActs;
};

annotate(asNative(LINE_NAITVE_TYPE), asUnit(true), asContainer(true))(Dialog);
