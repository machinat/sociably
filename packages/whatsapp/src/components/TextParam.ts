import { SociablyNode } from '@sociably/core';
import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppComponent } from '../types.js';

/** @category Props */
export type TextParamProps = {
  /**
   * The textual content to insert. For the header component, the character
   * limit is 60 characters. For the body component, the character limit is 1024
   * characters.
   */
  children: SociablyNode;
};

/**
 * Pass a text parameter into the body or header of a customized template
 *
 * @category Component
 * @props {@link TextParamProps}
 */
export const TextParam: WhatsAppComponent<
  TextParamProps,
  PartSegment<{ type: 'text'; text: string }>
> = makeWhatsAppComponent(async function TextParam(node, path, render) {
  const { children } = node.props;

  const contentSegments = await render(children, '.children');
  if (
    !contentSegments ||
    contentSegments.length > 1 ||
    contentSegments[0].type !== 'text'
  ) {
    throw new TypeError('"children" prop should contain only texual content');
  }

  return [
    makePartSegment(node, path, {
      type: 'text',
      text: contentSegments[0].value,
    }),
  ];
});
