import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent.js';
import { WhatsAppComponent } from '../types.js';

/** @category Props */
export type CatalogParamProps = {
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
};

/**
 * Define the copied coupon code of a copy code button
 *
 * @category Component
 * @props {@link CatalogParamProps}
 */
export const CatalogParam: WhatsAppComponent<
  CatalogParamProps,
  PartSegment<{}>
> = makeWhatsAppComponent(function CatalogParam(node, path) {
  const { index, thumbnailProductRetailerId } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'button',
      sub_type: 'catalog',
      index,
      parameters: [
        {
          type: 'action',
          action: {
            thumbnail_product_retailer_id: thumbnailProductRetailerId,
          },
        },
      ],
    }),
  ];
});
