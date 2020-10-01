/* eslint-disable import/prefer-default-export */
import { MachinatNode } from '@machinat/core/types';
import { unitSegment } from '@machinat/core/renderer';
import type {
  IntermediateSegment,
  FunctionOf,
} from '@machinat/core/renderer/types';
import { annotateTelegramComponent } from '../utils';
import {
  TelegramComponent,
  TelegramSegmentValue,
  TelegramParseMode,
} from '../types';

/**
 * @category Props
 */
type ExpressionProps = {
  children: MachinatNode;
  disableNotification?: boolean;
  parseMode?: TelegramParseMode;
  replyMarkup?: MachinatNode;
};

/** @internal */
const __Expression: FunctionOf<TelegramComponent<
  ExpressionProps,
  IntermediateSegment<TelegramSegmentValue>
>> = async function Expression(node, path, render) {
  const {
    children,
    disableNotification,
    parseMode = 'HTML',
    replyMarkup,
  } = node.props;

  const contentSegments:
    | null
    | IntermediateSegment<TelegramSegmentValue>[] = await render(
    children,
    '.children'
  );

  if (contentSegments === null) {
    return null;
  }

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');

  const outputSegments: IntermediateSegment<TelegramSegmentValue>[] = [];
  let lastReplyMarkupableIdx = -1;

  contentSegments.forEach((segment) => {
    if (segment.type === 'text') {
      lastReplyMarkupableIdx = outputSegments.length;

      outputSegments.push(
        unitSegment(node, path, {
          method: 'sendMessage',
          parameters: {
            text: segment.value,
            parse_mode: parseMode === 'None' ? undefined : parseMode,
            disable_notification: disableNotification,
          },
        })
      );
    } else if (segment.type === 'unit' || segment.type === 'raw') {
      const { method } = segment.value;

      if (method.slice(0, 4) === 'send' && method !== 'sendChatAction') {
        lastReplyMarkupableIdx = outputSegments.length;

        const { parameters } = segment.value;
        outputSegments.push({
          ...segment,
          value: {
            ...segment.value,
            parameters: {
              ...parameters,
              disable_notification:
                typeof parameters.disable_notification === 'undefined'
                  ? disableNotification
                  : parameters.disable_notification,
            },
          },
        });
      } else {
        outputSegments.push(segment);
      }
    } else if (segment.type !== 'break') {
      outputSegments.push(segment);
    }
  });

  if (replyMarkupSegments !== null) {
    if (lastReplyMarkupableIdx === -1) {
      throw new Error('no valid message for attaching reply markup onto');
    }

    const lastReplyMarkupable = outputSegments[lastReplyMarkupableIdx].value;
    if (lastReplyMarkupable.parameters.reply_markup) {
      throw new Error(
        'there is already a reply markup attached at the last message'
      );
    }

    lastReplyMarkupable.parameters.reply_markup = replyMarkupSegments[0].value;
  }

  return outputSegments;
};
/**
 *
 * @props {@link ExpressionProps}
 */
export const Expression: TelegramComponent<
  ExpressionProps,
  IntermediateSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Expression);
