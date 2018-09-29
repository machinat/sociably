import {
  renderTextContent,
  annotateNative,
  annotateNativeRoot,
} from 'machinat-renderer';

import { MESSENGER_NAITVE_TYPE } from '../symbol';
import { ENTRY_MESSAGES } from './apiEntry';

import { renderQuickReplies } from './utils';

export const Text = ({ children, quickReplies, metadata }, render) => ({
  message: {
    text: renderTextContent(children, render, '.children'),
    quick_replies: renderQuickReplies(quickReplies, render),
    metadata,
  },
});
annotateNativeRoot(Text, MESSENGER_NAITVE_TYPE, ENTRY_MESSAGES);

export const Latex = ({ children }, render) =>
  `\\(${renderTextContent(children, render, '.children')}\\)`;
annotateNative(Latex, MESSENGER_NAITVE_TYPE);
