import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppComponent } from '../types.js';

/** @category Props */
export type CurrencyParamProps = {
  /** Currency code as defined in ISO 4217 */
  code: string;
  /** Default text if localization fails */
  fallbackValue: string;
  /** Amount multiplied by 1000 */
  amount1000: number;
};

/**
 * Pass a currency parameter into the body or header of a customized template
 *
 * @category Component
 * @props {@link CurrencyParamProps}
 */
export const CurrencyParam: WhatsAppComponent<
  CurrencyParamProps,
  PartSegment<{ type: 'currency'; currency: {} }>
> = makeWhatsAppComponent(function CurrencyParam(node, path) {
  const { code, fallbackValue, amount1000 } = node.props;

  return [
    makePartSegment(node, path, {
      type: 'currency',
      currency: {
        code,
        fallback_value: fallbackValue,
        amount_1000: amount1000,
      },
    }),
  ];
});
