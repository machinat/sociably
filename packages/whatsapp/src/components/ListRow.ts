import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppComponent } from '../types.js';

/**
 * @category Props
 */
export type ListRowProps = {
  /** Row title. Maximum length: 24 characters */
  title: string;
  /** Row id. Maximum length: 200 characters */
  id: string;
  /** Row description. Maximum length: 72 characters */
  description?: string;
};

/**
 * Represent a row in a list template
 * @category Component
 * @props {@link ListRowProps}
 */
export const ListRow: WhatsAppComponent<
  ListRowProps,
  PartSegment<ListRowProps>
> = makeWhatsAppComponent(function ListRow(node, path) {
  const { title, id, description } = node.props;
  return [
    makePartSegment(node, path, {
      title,
      id,
      description,
    }),
  ];
});
