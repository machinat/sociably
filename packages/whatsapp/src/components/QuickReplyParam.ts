import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppComponent } from '../types.js';

/**
 * @category Props
 */
export type QuickReplyParamProps = {
  /**
   * Developer-defined payload that is returned when the button is clicked in
   * addition to the display text on the button.
   */
  payload: string;
  /**
   * The 0-indexed position of the button. If the value is undefined, it's
   * decided by the order of params.
   */
  index?: number;
};

/**
 * Define the payload of a quick reply button
 * @category Component
 * @props {@link QuickReplyParamProps}
 */
export const QuickReplyParam: WhatsAppComponent<
  QuickReplyParamProps,
  PartSegment<{}>
> = makeWhatsAppComponent(function QuickReplyParam(node, path) {
  const { index, payload } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'quick_reply',
      index,
      parameter: {
        type: 'payload',
        payload,
      },
    }),
  ];
});
