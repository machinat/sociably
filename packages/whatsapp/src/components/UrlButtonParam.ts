import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppComponent } from '../types.js';

/** @category Props */
export type UrlButtonParamProps = {
  /**
   * Developer-provided postfix that is appended to the predefined prefix URL in
   * the template.
   */
  urlPostfix: string;
  /**
   * The 0-indexed position of the button. If the value is undefined, it's
   * decided by the order of params.
   */
  index?: number;
};

/**
 * Pass a parameter to a dynamic URL button
 *
 * @category Component
 * @props {@link UrlButtonParamProps}
 */
export const UrlButtonParam: WhatsAppComponent<
  UrlButtonParamProps,
  PartSegment<{}>
> = makeWhatsAppComponent(function UrlButtonParam(node, path) {
  const { index, urlPostfix } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'button',
      sub_type: 'url',
      index,
      parameters: [
        {
          type: 'text',
          text: urlPostfix,
        },
      ],
    }),
  ];
});
