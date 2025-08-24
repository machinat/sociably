import type { SociablyNode } from '@sociably/core';
import { formatNode } from '@sociably/core/utils';
import { OutputSegment } from '@sociably/core/renderer';
import makeTwitterComponent from '../utils/makeTwitterComponent.js';
import createDmSegmentValue from '../utils/createDmSegmentValue.js';
import {
  TwitterSegmentValue,
  TwitterComponent,
  TwitterApiRequest,
} from '../types.js';

/** @category Props */
export type ExpressionProps = {
  /** Direct messages content */
  children: SociablyNode;
  /**
   * Quick replies to be attached after the messages. Should contain only
   * {@link QuickReply}
   */
  quickReplies?: SociablyNode;
  /** The custome profile to send the messages with */
  customProfileId?: string;
};

/**
 * Send direct messages with metadata
 *
 * @category Component
 * @props {@link ExpressionProps}
 * @guides Check official [guides](https://developer.twitter.com/en/docs/twitter-api/v1/direct-messages/api-features).
 */
export const Expression: TwitterComponent<
  ExpressionProps,
  OutputSegment<TwitterSegmentValue>
> = makeTwitterComponent(async function Expression(node, path, render) {
  const { children, quickReplies, customProfileId } = node.props;

  const [messageSegments, quickRepliesSegments] = await Promise.all([
    render<TwitterSegmentValue>(children, '.children'),
    render(quickReplies, '.quickReplies'),
  ]);

  const outputSegment: OutputSegment<TwitterSegmentValue>[] = [];
  let lastCreateDmRequest: undefined | TwitterApiRequest;

  for (const segment of messageSegments || []) {
    let createDmRequest: undefined | TwitterApiRequest;

    if (segment.type === 'part') {
      throw new TypeError(
        `${formatNode(segment.node)} can't be sent directly in <Expression/>`,
      );
    }
    if (segment.type === 'text') {
      const dmSegValue = createDmSegmentValue(segment.value);
      createDmRequest = dmSegValue.request;

      outputSegment.push({
        type: 'unit',
        node: segment.node,
        path: segment.path,
        value: dmSegValue,
      });
    } else if (segment.type === 'unit' || segment.type === 'raw') {
      const { value: segValue } = segment;

      if (segValue.type === 'tweet') {
        throw new TypeError(
          `${formatNode(segment.node)} can't be sent in <Expression/>`,
        );
      }
      if (
        segValue.type === 'dm' &&
        segValue.request.url === '1.1/direct_messages/events/new.json'
      ) {
        createDmRequest = segValue.request;
        outputSegment.push(segment);
      } else if (segValue.type === 'media') {
        const dmSegValue = createDmSegmentValue(undefined, segValue.attachment);
        createDmRequest = dmSegValue.request;

        outputSegment.push({
          type: 'unit',
          node: segment.node,
          path: segment.path,
          value: dmSegValue,
        });
      } else {
        outputSegment.push(segment);
      }
    } else if (segment.type !== 'break') {
      outputSegment.push(segment);
    }

    if (createDmRequest) {
      const dmOptions = createDmRequest.params.event.message_create;

      if (!dmOptions.custom_profile_id) {
        dmOptions.custom_profile_id = customProfileId;
      }
      lastCreateDmRequest = createDmRequest;
    }
  }

  if (quickRepliesSegments) {
    if (!lastCreateDmRequest) {
      throw new TypeError(
        'no message content available to attach quick replies',
      );
    }
    lastCreateDmRequest.params.event.message_create.message_data.quick_reply = {
      type: 'options',
      options: quickRepliesSegments.map(({ value }) => value),
    };
  }

  return outputSegment.length > 0 ? outputSegment : null;
});
