import { makePartSegment } from '@sociably/core/renderer';
import type { PartSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent.js';
import type { FacebookComponent } from '../types.js';

/**
 * @category Props
 */
export type CallButtonProps = {
  /** Button title, 20 character limit. */
  title: string;
  /**
   * Format must have "+" prefix followed by the country code, area code and
   * local number.
   */
  number: string;
};

/**
 * The Call Button can be used to initiate a phone call. This button can be used
 * with the Button and Generic Templates.
 * @category Component
 * @props {@link CallButtonProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/buttons#call)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/call).
 */
export const CallButton: FacebookComponent<
  CallButtonProps,
  PartSegment<{}>
> = makeFacebookComponent(function CallButton(node, path) {
  const { title, number } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'phone_number',
      title,
      number,
    }),
  ];
});
