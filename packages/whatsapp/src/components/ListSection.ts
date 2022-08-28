import { SociablyNode } from '@sociably/core';
import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent';
import { WhatsAppComponent } from '../types';

/**
 * @category Props
 */
export type ListSectionProps = {
  /**
   * Title of the section. Required if the message has more than one section.
   * Maximum length: 24 characters.
   */
  title?: string;
  /**
   * `ListRow` elements in the section. You can have a total of 10 rows across
   * all the sections
   */
  children: SociablyNode;
};

/**
 * Represent a section of rows in a list template
 * @category Component
 * @props {@link ListSectionProps}
 */
export const ListSection: WhatsAppComponent<
  ListSectionProps,
  PartSegment<{ title?: string; rows: unknown[] }>
> = makeWhatsAppComponent(async function ListSection(node, path, render) {
  const { title, children } = node.props;

  const rowsSegments = await render(children, '.children');
  if (!rowsSegments) {
    throw new TypeError('"children" prop should contain at least 1 <ListRow/>');
  }

  return [
    makePartSegment(node, path, {
      title,
      rows: rowsSegments.map(({ value }) => value),
    }),
  ];
});
