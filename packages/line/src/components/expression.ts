import { MachinatNode } from '@machinat/core';
import { IntermediateSegment, TextSegment } from '@machinat/core/renderer';
import { annotateLineComponent, isMessageValue } from '../utils';
import { LineComponent } from '../types';

/**
 * @category Props
 */
export type ExpressionProps = {
  /** Content nodes. */
  children: MachinatNode;
  /** {@link QuickReply} elements to be appended after content. */
  quickReplies?: MachinatNode;
};

/**
 * Append quick replies to the children content.
 * @category Component
 * @props {@link ExpressionProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#quick-reply).
 */
export const Expression: LineComponent<ExpressionProps> = annotateLineComponent(
  async function Expression(
    { props: { children, quickReplies } },
    path,
    render
  ) {
    const [segments, replySegments] = await Promise.all([
      render(children, '.children'),
      render(quickReplies, '.quickReplies'),
    ]);
    if (segments === null) {
      if (replySegments) {
        throw new Error('no message in children for attaching quickReplies');
      }
      return null;
    }

    let lastMessageIdx = -1;
    const hoistedSegments: Exclude<IntermediateSegment<any>, TextSegment>[] =
      segments.map((segment, i) => {
        // hoisting text to text message object
        if (segment.type === 'text') {
          lastMessageIdx = i;
          return {
            type: 'unit',
            value: { type: 'text', text: segment.value },
            node: segment.node,
            path: segment.path,
          };
        }

        if (segment.type === 'unit' && isMessageValue(segment.value)) {
          lastMessageIdx = i;
        }
        return segment;
      });

    if (replySegments) {
      if (lastMessageIdx === -1) {
        throw new Error('no message in children for attaching quickReplies');
      }

      const messageSegment = hoistedSegments[lastMessageIdx];
      hoistedSegments.splice(lastMessageIdx, 1, {
        ...messageSegment,
        value: {
          ...messageSegment.value,
          quickReply: {
            items: replySegments.map((segment) => segment.value),
          },
        },
      });
    }

    return hoistedSegments;
  }
);
