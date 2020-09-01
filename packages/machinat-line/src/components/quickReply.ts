/* eslint-disable import/prefer-default-export */
import { MachinatNode } from '@machinat/core/types';
import { partSegment } from '@machinat/core/renderer';
import { PartSegment } from '@machinat/core/renderer/types';
import { annotateLineComponent } from '../utils';
import { LineComponent } from '../types';

/**
 * @category Props
 */
type QuickReplyProps = {
  /** URL of the icon that is displayed at the beginning of the button. */
  imageUrl?: string;
  /** Alias of `imageUrl`. */
  imageURL?: string;
  /** An {@link Action} element to be performed when the button is touched. */
  action: MachinatNode;
};

/** @internal */
const __QuickReply = async function QuickReply(node, path, render) {
  const { imageUrl, imageURL, action } = node.props;

  const actionSegments = await render(action, '.action');
  const actionValue = actionSegments?.[0].value;

  return [
    partSegment(node, path, {
      type: 'action',
      imageUrl: imageUrl || imageURL,
      action: actionValue,
    }),
  ];
};

/**
 * QuickReply add a button at the bottom of screen after the {@link Expression}
 * containing it is displayed.
 * @category Component
 * @props {@link QuickReplyProps}
 * @guides Check official [doc](https://developers.line.biz/en/docs/messaging-api/using-quick-reply/)
 *   and [reference](https://developers.line.biz/en/reference/messaging-api/#quick-reply).
 */
export const QuickReply: LineComponent<
  QuickReplyProps,
  PartSegment<any>
> = annotateLineComponent(__QuickReply);