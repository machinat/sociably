import { NativeElement, AnyNativeComponent } from '@sociably/core';
import { InnerRenderFn } from '@sociably/core/renderer';
import {
  Expression as MessengerExpression,
  ExpressionProps as MessengerExpressionProps,
} from '@sociably/meta-messenger-platform-base/components';
import makeInstagramComponent from '../utils/makeInstagramComponent.js';
import type { InstagramComponent } from '../types.js';

export type ExpressionProps = Omit<MessengerExpressionProps, 'tag'> & {
  /**
   * Human agent support for issues that cannot be resolved within the 24 hour
   * standard messaging window, such as resolving issues outside normal business
   * hours or issues requiring more than 24 hours to resolve
   */
  tag?: 'HUMAN_AGENT';
};

/**
 * Annotate all the children content with the message settings attributes and
 * append quick replies after the content.
 *
 * @category Component
 * @props {@link ExpressionProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const Expression: InstagramComponent<ExpressionProps> =
  makeInstagramComponent(function Expression(
    node: NativeElement<ExpressionProps, AnyNativeComponent>,
    path: string,
    innerRender: InnerRenderFn,
  ) {
    return MessengerExpression(node, path, innerRender);
  });
