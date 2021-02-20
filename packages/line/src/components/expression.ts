/* eslint-disable import/prefer-default-export */
import { MachinatNode } from '@machinat/core/types';
import { FunctionOf } from '@machinat/core/renderer/types';
import { annotateLineComponent, isMessageValue } from '../utils';
import { LineComponent } from '../types';

/**
 * @category Props
 */
type ExpressionProps = {
  /** Content nodes. */
  children: MachinatNode;
  /** {@link QuickReply} elements to be appended after content. */
  quickReplies?: MachinatNode;
};

/** @internal */
const __Expression: FunctionOf<LineComponent<
  ExpressionProps
>> = async function Expression(
  { props: { children, quickReplies } },
  path,
  render
) {
  const segments = await render(children, '.children');
  if (segments === null) {
    return null;
  }

  let lastMessageIdx = -1;

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    const { type, value } = segment;

    // hoisting text to line text message object
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
      items: quickReplySegments.map((segment) => segment.value),
    };
  }

  return segments;
};

/**
 * Append quick replies to the children content.
 * @category Component
 * @props {@link ExpressionProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#quick-reply).
 */
export const Expression: LineComponent<ExpressionProps> = annotateLineComponent(
  __Expression
);
