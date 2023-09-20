import type {
  SociablyNode,
  NativeElement,
  AnyNativeComponent,
} from '@sociably/core';
import snakeCaseKeys from 'snakecase-keys';
import {
  makeUnitSegment,
  makePartSegment,
  InnerRenderFn,
  UnitSegment,
  PartSegment,
} from '@sociably/core/renderer';
import { PATH_MESSAGES } from '../constant.js';
import type { MessageValue } from '../types.js';

/** @category Props */
export type ReceiptItemProps = {
  /** The name to display for the item. */
  title: string;
  /** The subtitle for the item, usually a brief item description. */
  subtitle?: string;
  /** The quantity of the item purchased. */
  quantity?: number;
  /** The price of the item. For free items, '0' is allowed. */
  price: number;
  /** The currency of the item price. */
  currency?: string;
  /** The URL of an image to be displayed with the item. */
  imageUrl?: string;
};

export function ReceiptItem(
  node: NativeElement<ReceiptItemProps, AnyNativeComponent>,
  path: string,
): PartSegment<{}>[] {
  const { title, subtitle, quantity, price, currency, imageUrl } = node.props;
  return [
    makePartSegment(node, path, {
      title,
      subtitle,
      quantity,
      price,
      currency,
      image_url: imageUrl,
    }),
  ];
}

/** @category Props */
export type ReceiptTemplateProps = {
  /**
   * Maximum of 100 {@line ReceiptItem} elements that describe items in the
   * order. Sort order of the elements is not guaranteed.
   */
  children: SociablyNode;
  /**
   * Set to true to enable the native share button in Messenger for the template
   * message. Defaults to false.
   */
  sharable?: boolean;
  /** The recipient's name. */
  recipientName: string;
  /** The merchant's name. If present this is shown as logo text. */
  merchantName?: string;
  /** The order number. Must be unique. */
  orderNumber: string;
  /** The currency of the payment. */
  currency: string;
  /**
   * The payment method used. Providing enough information for the customer to
   * decipher which payment method and account they used is recommended. This
   * can be a custom string, such as, "Visa 1234".
   */
  paymentMethod: string;
  orderUrl?: string;
  /** Timestamp of the order in seconds. */
  timestamp?: string | Date;
  /** The shipping address of the order. */
  address?: {
    /** The street address, line 1. */
    street1: string;
    /** Optional. The street address, line 2. */
    street2?: string;
    /** The city name of the address. */
    city: string;
    /** The postal code of the address. */
    postalCode: string;
    /**
     * The state abbreviation for U.S. addresses, or the region/province for
     * non-U.S. addresses.
     */
    state: string;
    /** The two-letter country abbreviation of the address. */
    country: string;
  };
  summary: {
    /** Optional. The sub-total of the order. */
    subtotal?: number;
    /** Optional. The shipping cost of the order. */
    shippingCost?: number;
    /** Optional. The tax of the order. */
    totalTax?: number;
    /** The total cost of the order, including sub-total, shipping, and tax. */
    totalCost: number;
  };
  adjustments?: {
    /** Name of the adjustment. */
    name: string;
    /** The amount of the adjustment. */
    amount: number;
  }[];
};

export async function ReceiptTemplate(
  node: NativeElement<ReceiptTemplateProps, AnyNativeComponent>,
  path: string,
  render: InnerRenderFn,
): Promise<UnitSegment<MessageValue>[]> {
  const {
    children,
    sharable,
    recipientName,
    merchantName,
    orderNumber,
    currency,
    paymentMethod,
    orderUrl,
    timestamp,
    address,
    summary,
    adjustments,
  } = node.props;

  const elementSegments = await render(children, '.children');
  const elementValues = elementSegments?.map((segment) => segment.value);

  return [
    makeUnitSegment(node, path, {
      type: 'message',
      apiPath: PATH_MESSAGES,
      params: {
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'receipt',
              sharable,
              recipient_name: recipientName,
              merchant_name: merchantName,
              order_number: orderNumber,
              currency,
              payment_method: paymentMethod,
              order_url: orderUrl,
              timestamp:
                timestamp instanceof Date
                  ? `${Math.floor(timestamp.getTime() / 1000)}`
                  : timestamp,
              address: address ? snakeCaseKeys(address) : undefined,
              summary: summary ? snakeCaseKeys(summary) : undefined,
              adjustments,
              elements: elementValues,
            },
          },
        },
      },
    }),
  ];
}
