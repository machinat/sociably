import { SociablyNode } from '@sociably/core';
import { makeUnitSegment, IntermediateSegment } from '@sociably/core/renderer';
import makeTelegramComponent from '../utils/makeTelegramComponent.js';
import {
  TelegramComponent,
  TelegramSegmentValue,
  TelegramParseMode,
} from '../types.js';

/** @category Props */
export type ExpressionProps = {
  children: SociablyNode;
  disableNotification?: boolean;
  parseMode?: TelegramParseMode;
  replyMarkup?: SociablyNode;
};

/**
 * Control options including disableNotification, parseMode of a group of
 * messages. Or add a replyMarkup at the last message in the Expression.
 *
 * @category Component
 * @props {@link ExpressionProps}
 */
export const Expression: TelegramComponent<
  ExpressionProps,
  IntermediateSegment<TelegramSegmentValue>
> = makeTelegramComponent(async function Expression(node, path, render) {
  const {
    children,
    disableNotification,
    parseMode = 'HTML',
    replyMarkup,
  } = node.props;

  const contentSegments: null | IntermediateSegment<TelegramSegmentValue>[] =
    await render(children, '.children');

  if (contentSegments === null) {
    return null;
  }

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');

  const outputSegments: IntermediateSegment<TelegramSegmentValue>[] = [];
  let lastEmptyMarkupSlot = -1;

  contentSegments.forEach((segment) => {
    if (segment.type === 'text') {
      lastEmptyMarkupSlot = outputSegments.length;

      outputSegments.push(
        makeUnitSegment(node, path, {
          method: 'sendMessage',
          params: {
            text: segment.value,
            parse_mode: parseMode === 'None' ? undefined : parseMode,
            disable_notification: disableNotification,
          },
        }),
      );
    } else if (segment.type === 'unit' || segment.type === 'raw') {
      const { method } = segment.value;

      if (method.startsWith('send') && method !== 'sendChatAction') {
        const { params } = segment.value;
        if (!params.reply_markup) {
          lastEmptyMarkupSlot = outputSegments.length;
        }

        outputSegments.push({
          ...segment,
          value: {
            ...segment.value,
            params: {
              ...params,
              disable_notification:
                typeof params.disable_notification === 'undefined'
                  ? disableNotification
                  : params.disable_notification,
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
    if (lastEmptyMarkupSlot === -1) {
      throw new Error('no message available to attach reply markup');
    }
    outputSegments[lastEmptyMarkupSlot].value.params.reply_markup =
      replyMarkupSegments[0].value;
  }

  return outputSegments;
});
