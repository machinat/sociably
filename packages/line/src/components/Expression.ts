import { SociablyNode } from '@sociably/core';
import {
  IntermediateSegment,
  TextSegment,
  UnitSegment,
} from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent';
import { LineComponent, MessageSegmentValue, LineSegmentValue } from '../types';

/**
 * @category Props
 */
export type ExpressionProps = {
  /** Content nodes. */
  children: SociablyNode;
  /** {@link QuickReply} elements to be appended after content. */
  quickReplies?: SociablyNode;
};

/**
 * Append quick replies to the children content.
 * @category Component
 * @props {@link ExpressionProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#quick-reply).
 */
export const Expression: LineComponent<ExpressionProps> = makeLineComponent(
  async function Expression(
    { props: { children, quickReplies } },
    _path,
    render
  ) {
    const [segments, replySegments] = await Promise.all([
      render<LineSegmentValue>(children, '.children'),
      render(quickReplies, '.quickReplies'),
    ]);
    if (segments === null) {
      if (replySegments) {
        throw new Error('no message in children for attaching quickReplies');
      }
      return null;
    }

    let lastMessageIdx = -1;
    const hoistedSegments: Exclude<
      IntermediateSegment<LineSegmentValue>,
      TextSegment
    >[] = segments.map((segment, i) => {
      if (
        segment.type === 'text' ||
        ((segment.type === 'unit' || segment.type === 'raw') &&
          segment.value.type === 'message')
      ) {
        lastMessageIdx = i;
      }

      return segment.type === 'text'
        ? {
            type: 'unit',
            value: {
              type: 'message',
              params: { type: 'text', text: segment.value },
            },
            node: segment.node,
            path: segment.path,
          }
        : segment;
    });

    if (replySegments) {
      if (lastMessageIdx === -1) {
        throw new Error('no message in children for attaching quickReplies');
      }

      const messageSegment = hoistedSegments[
        lastMessageIdx
      ] as UnitSegment<MessageSegmentValue>;

      const newSegment: UnitSegment<MessageSegmentValue> = {
        ...messageSegment,
        value: {
          ...messageSegment.value,
          params: {
            ...messageSegment.value.params,
            quickReply: {
              items: replySegments.map((segment) => segment.value),
            },
          },
        },
      };

      hoistedSegments.splice(lastMessageIdx, 1, newSegment);
    }

    return hoistedSegments;
  }
);
