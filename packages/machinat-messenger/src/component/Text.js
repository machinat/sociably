import {
  renderOnlyInTypes,
  getRendered,
  renderTextContent,
  annotateNative,
  annotateNativeRoot,
} from './utils';
import { ENTRY_MESSAGES } from './constant';
import * as quickRepliesComponents from './quickReply';

const quickReplyTypes = Object.values(quickRepliesComponents);

export const Text = ({ children, quickReplies, metadata }, render) => {
  const repliesResult = renderOnlyInTypes(
    quickReplyTypes,
    quickReplies,
    render,
    '.quickReplies'
  );

  return {
    message: {
      text: renderTextContent(children, render, '.children'),
      quick_replies: repliesResult && repliesResult.map(getRendered),
      metadata,
    },
  };
};
annotateNativeRoot(Text, ENTRY_MESSAGES);

export const Latex = ({ children }, render) =>
  `\\(${renderTextContent(children, render, '.children')}\\)`;
annotateNative(Latex);
