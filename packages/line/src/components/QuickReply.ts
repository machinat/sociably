/* eslint-disable import/prefer-default-export */
import { SociablyNode } from '@sociably/core';
import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent';
import { LineComponent } from '../types';

/**
 * @category Props
 */
export type QuickReplyProps = {
  /** URL of the icon that is displayed at the beginning of the button. */
  imageUrl?: string;
  /** One {@link Action} element to be performed when the button is touched. */
  children: SociablyNode;
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
  PartSegment<{}>
> = makeLineComponent(async function QuickReply(node, path, render) {
  const { imageUrl, children } = node.props;

  const actionSegments = await render(children, '.children');
  const actionValue = actionSegments?.[0].value;

  return [
    makePartSegment(node, path, {
      type: 'action',
      imageUrl: imageUrl || imageUrl,
      action: actionValue,
    }),
  ];
});
