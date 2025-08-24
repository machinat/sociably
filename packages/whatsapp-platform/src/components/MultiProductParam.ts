import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppComponent } from '../types.js';

type MultiPruductSction = {
  /** Section title text. Maximum 24 characters. Markdown is not supported. */
  title: string;
  /**
   * SKU number of the item you want to appear in the section. SKU numbers are
   * labeled as Content ID in the Commerce Manager. Supports up to 30 products
   * total, across all sections.
   */
  productItems: { productRetailerId: string }[];
};

/** @category Props */
export type MultiProductParamProps = {
  /**
   * Item SKU number. Labeled as Content ID in the Commerce Manager. The
   * thumbnail of this item will be used as the message's header image.
   */
  thumbnailProductRetailerId: string;
  /**
   * The 0-indexed position of the button. If the value is undefined, it's
   * decided by the order of params.
   */
  index?: number;
  /** You can define up to 10 sections. */
  sections: MultiPruductSction[];
};

/**
 * Define the copied coupon code of a copy code button
 *
 * @category Component
 * @props {@link MultiProductParamProps}
 */
export const MultiProductParam: WhatsAppComponent<
  MultiProductParamProps,
  PartSegment<{}>
> = makeWhatsAppComponent(function MultiProductParam(node, path) {
  const { index, thumbnailProductRetailerId } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'button',
      sub_type: 'mpm',
      index,
      parameters: [
        {
          type: 'action',
          action: {
            thumbnail_product_retailer_id: thumbnailProductRetailerId,
          },
          sections: node.props.sections.map((section) => ({
            title: section.title,
            product_items: section.productItems.map((productItem) => ({
              product_retailer_id: productItem.productRetailerId,
            })),
          })),
        },
      ],
    }),
  ];
});
