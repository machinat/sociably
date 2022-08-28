import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent';
import { WhatsAppComponent } from '../types';

/**
 * @category Props
 */
export type UrlButtonParamProps = {
  /**
   * Developer-provided suffix that is appended to the predefined prefix URL in
   * the template.
   */
  urlSuffix: string;
  /**
   * The 0-indexed position of the button. If the value is undefined, it's
   * decided by the order of params.
   */
  index?: number;
};

/**
 * Pass a parameter to a dynamic URL button
 * @category Component
 * @props {@link UrlButtonParamProps}
 */
export const UrlButtonParam: WhatsAppComponent<
  UrlButtonParamProps,
  PartSegment<{}>
> = makeWhatsAppComponent(function UrlButtonParam(node, path) {
  const { index, urlSuffix } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'url',
      index,
      parameter: {
        type: 'text',
        text: urlSuffix,
      },
    }),
  ];
});
