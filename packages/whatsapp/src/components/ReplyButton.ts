import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppComponent } from '../types.js';

/**
 * @category Props
 */
export type ReplyButtonProps = {
  /** Button title. Maximum length: 24 characters */
  title: string;
  /** Row id. Maximum length: 200 characters */
  id: string;
};

/**
 * Represent a button in a buttons template
 * @category Component
 * @props {@link ReplyButtonProps}
 */
export const ReplyButton: WhatsAppComponent<
  ReplyButtonProps,
  PartSegment<{ type: 'reply'; reply: { title: string; id: string } }>
> = makeWhatsAppComponent(function ReplyButton(node, path) {
  const { title, id } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'reply',
      reply: { title, id },
    }),
  ];
});
