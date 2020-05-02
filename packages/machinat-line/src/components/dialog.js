/* eslint-disable import/prefer-default-export */
import { annotateLineComponent, isMessageValue } from '../utils';

export const Dialog = async (
  { props: { children, quickReplies } },
  path,
  render
) => {
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

  if (quickReplySegments) {
    if (lastMessageIdx === -1) {
      throw new Error('no message existed in children to attach quickReply');
    }

    segments[lastMessageIdx].value.quickReply = {
      items: quickReplySegments.map(segment => segment.value),
    };
  }

  return segments;
};
annotateLineComponent(Dialog);
