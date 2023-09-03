import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppComponent } from '../types.js';

/** @category Props */
export type ListRowProps = {
  /** Row title. Maximum length: 24 characters */
  title: string;
  /** Row data. Maximum length: 200 characters */
  data: string;
  /** Row description. Maximum length: 72 characters */
  description?: string;
};

/**
 * Represent a row in a list template
 *
 * @category Component
 * @props {@link ListRowProps}
 */
export const ListRow: WhatsAppComponent<
  ListRowProps,
  PartSegment<{ title: string; id: string; description?: string }>
> = makeWhatsAppComponent(function ListRow(node, path) {
  const { title, data, description } = node.props;
  return [
    makePartSegment(node, path, {
      title,
      id: data,
      description,
    }),
  ];
});
