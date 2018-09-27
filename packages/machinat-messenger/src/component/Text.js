import {
  renderQuickReplies,
  renderTextContent,
  annotateNative,
  annotateNativeRoot,
} from './utils';
import { ENTRY_MESSAGES } from './constant';

export const Text = ({ children, quickReplies, metadata }, render) => ({
  message: {
    text: renderTextContent(children, render, '.children'),
    quick_replies: renderQuickReplies(quickReplies, render),
    metadata,
  },
});
annotateNativeRoot(Text, ENTRY_MESSAGES);

export const Latex = ({ children }, render) =>
  `\\(${renderTextContent(children, render, '.children')}\\)`;
annotateNative(Latex);
