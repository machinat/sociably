import { SociablyNode } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent.js';
import {
  LineComponent,
  MessageSegmentValue,
  TemplateMessageParams,
} from '../types.js';

/** @category Props */
export type ConfirmTemplateProps = {
  /**
   * Alternative text. Displayed on devices that do not support template
   * messages. Max character limit: 400 If a function is given, the return value
   * would be used. The rendered template object is passed as the first param.
   */
  altText?: string | ((message: TemplateMessageParams) => string);
  /** Exactly 2 {@link Action} elements displayed as the buttons at the template. */
  actions: SociablyNode;
  /** Message text Max character limit: 240 */
  text: string;
};

/**
 * Template with two action buttons.
 *
 * @category Component
 * @props {@link ConfirmTemplateProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#confirm).
 */
export const ConfirmTemplate: LineComponent<
  ConfirmTemplateProps,
  UnitSegment<MessageSegmentValue>
> = makeLineComponent(async function ConfirmTemplate(node, path, render) {
  const { actions, altText, text } = node.props;
  const actionSegments = await render(actions, '.actions');
  const templateMessage: TemplateMessageParams = {
    type: 'template',
    altText: '',
    template: {
      type: 'confirm',
      text,
      actions: actionSegments?.map((segment) => segment.value) || [],
    },
  };

  return [
    makeUnitSegment(node, path, {
      type: 'message',
      params: {
        ...templateMessage,
        altText:
          typeof altText === 'function'
            ? altText(templateMessage)
            : altText || text,
      },
    }),
  ];
});
