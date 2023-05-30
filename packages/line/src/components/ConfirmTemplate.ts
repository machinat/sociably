import { SociablyNode } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent.js';
import { LineComponent, MessageSegmentValue } from '../types.js';

/**
 * @category Props
 */
export type ConfirmTemplateProps = {
  /**
   * Alternative text. Displayed on devices that do not support template
   * messages. Max character limit: 400
   * If a function is given, the return value would be used. The rendered
   * template object is passed as the first param.
   */
  altText: string | ((template: Record<string, any>) => string);
  /**
   * Exactly 2 {@link Action} elements displayed as the buttons at the template.
   */
  actions: SociablyNode;
  /** Texual nodes of message text. */
  children: string;
};

/**
 * Template with two action buttons.
 * @category Component
 * @props {@link ConfirmTemplateProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#confirm).
 */
export const ConfirmTemplate: LineComponent<
  ConfirmTemplateProps,
  UnitSegment<MessageSegmentValue>
> = makeLineComponent(async function ConfirmTemplate(node, path, render) {
  const { actions, altText, children } = node.props;
  const [actionSegments, textSegments] = await Promise.all([
    render(actions, '.actions'),
    render(children, '.children'),
  ]);

  const template = {
    type: 'confirm',
    text: textSegments?.[0].value,
    actions: actionSegments?.map((segment) => segment.value),
  };

  return [
    makeUnitSegment(node, path, {
      type: 'message',
      params: {
        type: 'template',
        altText: typeof altText === 'function' ? altText(template) : altText,
        template,
      },
    }),
  ];
});
