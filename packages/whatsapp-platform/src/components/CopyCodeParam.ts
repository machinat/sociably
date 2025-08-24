import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppComponent } from '../types.js';

/** @category Props */
export type CopyCodeParamProps = {
  /** The coupon code to be copied when the customer taps the button. */
  code: string;
  /**
   * The 0-indexed position of the button. If the value is undefined, it's
   * decided by the order of params.
   */
  index?: number;
};

/**
 * Define the coupon code of a copy code button
 *
 * @category Component
 * @props {@link CopyCodeParamProps}
 */
export const CopyCodeParam: WhatsAppComponent<
  CopyCodeParamProps,
  PartSegment<{}>
> = makeWhatsAppComponent(function CopyCodeParam(node, path) {
  const { index, code } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'button',
      sub_type: 'copy_code',
      index,
      parameters: [
        {
          type: 'coupon_code',
          coupon_code: code,
        },
      ],
    }),
  ];
});
