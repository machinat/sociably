import type { MachinatNode } from '@machinat/core';
import { formatNode } from '@machinat/core/utils';
import { OutputSegment } from '@machinat/core/renderer';
import { makeTwitterComponent, createDmSegmentValue } from '../utils';
import {
  TwitterSegmentValue,
  TwitterComponent,
  TwitterApiRequest,
} from '../types';

/**
 * @category Props
 */
export type ExpressionProps = {
  /** Direct messages content  */
  children: MachinatNode;
  /** Quick replies to be attached after the messages. Should contain only {@link QuickReply} */
  quickReplies?: MachinatNode;
  /** The custome profile to send the messages with */
  customProfileId?: string;
};

/**
 * Send direct messages with metadata
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
        `${formatNode(segment.node)} can't be sent directly in <Expression/>`
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
          `${formatNode(segment.node)} can't be sent in <Expression/>`
        );
      }
      if (
        segValue.type === 'dm' &&
        segValue.request.href === '1.1/direct_messages/events/new.json'
      ) {
        createDmRequest = segValue.request;
        outputSegment.push(segment);
      } else if (segValue.type === 'media') {
        const dmSegValue = createDmSegmentValue(undefined, segValue.media);
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
      const dmOptions = createDmRequest.parameters.event.message_create;

      if (!dmOptions.custom_profile_id) {
        dmOptions.custom_profile_id = customProfileId;
      }
      lastCreateDmRequest = createDmRequest;
    }
  }

  if (quickRepliesSegments) {
    if (!lastCreateDmRequest) {
      throw new TypeError(
        'no message content available to attach quick replies'
      );
    }
    lastCreateDmRequest.parameters.event.message_create.message_data.quick_reply =
      {
        type: 'options',
        options: quickRepliesSegments.map(({ value }) => value),
      };
  }

  return outputSegment.length > 0 ? outputSegment : null;
});
