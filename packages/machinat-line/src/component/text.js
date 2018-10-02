import {
  annotateNativeRoot,
  annotateNative,
  renderTextContent,
} from 'machinat-renderer';
import { LINE_NAITVE_TYPE } from '../symbol';
import { renderQuickReplies } from './utils';

export const Text = ({ children, quickReplies }, render) => ({
  type: 'text',
  text: renderTextContent(children, render, '.children'),
  quickReplies: renderQuickReplies(quickReplies, render),
});

annotateNativeRoot(Text, LINE_NAITVE_TYPE);

export const Emoji = ({ code }) => String.fromCodePoint(code);
annotateNative(Emoji, LINE_NAITVE_TYPE);
