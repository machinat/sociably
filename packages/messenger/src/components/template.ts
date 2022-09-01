/* eslint-disable camelcase */
import type { SociablyNode } from '@sociably/core';
import { formatNode } from '@sociably/core/utils';
import { makeUnitSegment, makePartSegment } from '@sociably/core/renderer';
import type { UnitSegment, PartSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent';
import { PATH_MESSAGES } from '../constant';
import type { MessageValue, MessengerComponent } from '../types';

/**
 * At least one property must be set in addition to title.
 * @category Props
 */
export type GenericItemProps = {
  /** The title to display in the template. 80 character limit. */
  title: string;
  /** The URL of the image to display in the template. */
  imageUrl?: string;
  /** The subtitle to display in the template. 80 character limit. */
  subtitle?: string;
  /**
   * Button elements to append to the template. A maximum of 3 buttons is
   * supported.
   */
  buttons?: SociablyNode;
  /**
   * One {@link UrlButton} element to act as the default action executed when
   * the template is tapped.
   */
  defaultAction?: SociablyNode;
};

/**
 * The item of the {@link GenericTemplate}.
 * @category Component
 * @props {@link GenericItemProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/generic).
 */
export const GenericItem: MessengerComponent<
  GenericItemProps,
  PartSegment<any>
> = makeFacebookComponent(async function GenericItem(node, path, render) {
  const {
    buttons,
    title,
    imageUrl,
    subtitle,
    defaultAction: defaultActionProp,
  } = node.props;

  const buttonSegments = await render(buttons, '.buttons');
  const buttonValues = buttonSegments?.map((segment) => segment.value);

  const defaultActionSegments = await render(
    defaultActionProp,
    '.defaultAction'
  );

  let defaultAction;
  if (defaultActionSegments !== null) {
    const { title: _, ...restOfUrlButton } = defaultActionSegments[0].value;
    defaultAction = restOfUrlButton;
  }

  return [
    makePartSegment(node, path, {
      title,
      image_url: imageUrl,
      subtitle,
      default_action: defaultAction,
      buttons: buttonValues,
    }),
  ];
});

/**
 * @category Props
 */
export type GenericTemplateProps = {
  /**
   * {@link GenericItem} elements under the template. Specifying multiple
   * elements will send a horizontally scrollable carousel of templates. A
   * maximum of 10 elements is supported.
   */
  children: SociablyNode;
  sharable?: boolean;
  /**
   * The aspect ratio used to render images specified by element.image_url.
   * Defaults to horizontal.
   */
  imageAspectRatio?: 'horizontal' | 'square';
};

/**
 * The generic template allows you to send a structured message that includes an
 * image, text and buttons. A generic template with multiple templates described
 * in the elements array will send a horizontally scrollable carousel of items,
 * each composed of an image, text and buttons.
 * @category Component
 * @props {@link GenericTemplateProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/generic).
 */
export const GenericTemplate: MessengerComponent<
  GenericTemplateProps,
  UnitSegment<MessageValue>
> = makeFacebookComponent(async function GenericTemplate(node, path, render) {
  const { children, sharable, imageAspectRatio } = node.props;
  const elementsSegments = await render(children, '.children');
  const elementValues = elementsSegments?.map((segment) => segment.value);

  return [
    makeUnitSegment(node, path, {
      apiPath: PATH_MESSAGES,
      params: {
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              sharable,
              image_aspect_ratio: imageAspectRatio,
              elements: elementValues,
            },
          },
        },
      },
    }),
  ];
});

/**
 * @category Props
 */
export type ButtonTemplateProps = {
  /**
   * Textual node with content up to 640 characters. Text will appear above the
   * buttons.
   */
  children: SociablyNode;
  /** 1-3 button elements to append after the text. */
  buttons: SociablyNode;
  sharable?: boolean;
};

/**
 * The button template allows you to send a structured message that includes
 * text and buttons.
 * @category Component
 * @props {@link ButtonTemplateProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/button)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/button).
 */
export const ButtonTemplate: MessengerComponent<
  ButtonTemplateProps,
  UnitSegment<MessageValue>
> = makeFacebookComponent(async function ButtonTemplate(node, path, render) {
  const { children, buttons, sharable } = node.props;
  const textSegments = await render(children, '.children');

  if (!textSegments) {
    throw new TypeError(`"children" prop should not be empty`);
  }
  for (const segment of textSegments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-textual node ${formatNode(
          segment.node
        )} received, only textual nodes allowed`
      );
    }
  }

  const buttonSegments = await render(buttons, '.buttons');
  const buttonValues = buttonSegments?.map((segment) => segment.value);

  return [
    makeUnitSegment(node, path, {
      apiPath: PATH_MESSAGES,
      params: {
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text: textSegments[0].value,
              sharable,
              buttons: buttonValues,
            },
          },
        },
      },
    }),
  ];
});

/**
 * @category Props
 */
export type MediaTemplateProps = {
  /** The type of media being sent */
  mediaType: 'image' | 'video';
  /** One optional button element to be appended to the template */
  buttons?: SociablyNode;
  /** The attachment ID of the image or video. Cannot be used if url is set. */
  attachmentId?: string;
  /** The URL of the image. Cannot be used if attachment_id is set. */
  url?: string;
  /**
   * Set to true to enable the native share button in Messenger for the template
   * message. Defaults to false.
   */
  sharable?: boolean;
};

/**
 * The media template allows you to send a structured message that includes an
 * image or video, and an optional button.
 * @category Component
 * @props {@link MediaTemplate}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/media)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/media).
 */
export const MediaTemplate: MessengerComponent<
  MediaTemplateProps,
  UnitSegment<MessageValue>
> = makeFacebookComponent(async function MediaTemplate(node, path, render) {
  const { buttons, mediaType, attachmentId, url, sharable } = node.props;
  const buttonSegments = await render(buttons, '.buttons');
  const buttonValues = buttonSegments?.map((segment) => segment.value);

  return [
    makeUnitSegment(node, path, {
      apiPath: PATH_MESSAGES,
      params: {
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'media',
              sharable,
              elements: [
                {
                  media_type: mediaType,
                  url,
                  attachment_id: attachmentId,
                  buttons: buttonValues,
                },
              ],
            },
          },
        },
      },
    }),
  ];
});

/**
 * @category Props
 */
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

/**
 * The item of {@link ReceiptTemplate}
 * @category Component
 * @props {@link ReceiptItemProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/receipt)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/receipt).
 */
export const ReceiptItem: MessengerComponent<
  ReceiptItemProps,
  PartSegment<any>
> = makeFacebookComponent(async function ReceiptItem(node, path) {
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
});

/**
 * @category Props
 */
export type ReceiptTemplateProps = {
  /**
   * Maximum of 100 {@line ReceiptItem} elements that describe items in the
   * order. Sort order of the elements is not guaranteed.
   */
  children: SociablyNode;
  /**
   * Set to true to enable the native share button in Messenger for the
   * template message. Defaults to false.
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
    street_1: string;
    /** Optional. The street address, line 2. */
    street_2?: string;
    /** The city name of the address. */
    city: string;
    /** The postal code of the address. */
    postal_code: string;
    /** The state abbreviation for U.S. addresses, or the region/province for non-U.S. addresses. */
    state: string;
    /** The two-letter country abbreviation of the address. */
    country: string;
  };
  summary: {
    /** Optional. The sub-total of the order. */
    subtotal?: number;
    /** Optional. The shipping cost of the order. */
    shipping_cost?: number;
    /** Optional. The tax of the order. */
    total_tax?: number;
    /** The total cost of the order, including sub-total, shipping, and tax. */
    total_cost: number;
  };
  adjustments?: {
    /** Name of the adjustment. */
    name: string;
    /** The amount of the adjustment. */
    amount: number;
  }[];
};

/**
 * The receipt template allows you to send an order confirmation as a structured
 * message.
 * @category Component
 * @props {@link ReceiptTemplateProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/template/receipt)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/templates/receipt).
 */
export const ReceiptTemplate: MessengerComponent<
  ReceiptTemplateProps,
  UnitSegment<MessageValue>
> = makeFacebookComponent(async function ReceiptTemplate(node, path, render) {
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
              address,
              summary,
              adjustments,
              elements: elementValues,
            },
          },
        },
      },
    }),
  ];
});

/**
 * @category Props
 */
export type RequestOneTimeNotifProps = {
  /** The title to be displayed in the request message, limited to 65 characters. */
  title: string;
  /** The data to be posted back with the `one_time_notif_optin` event. */
  payload: string;
};

/**
 * The Messenger Platform's One-Time Notification API (Beta) allows a page to
 * request a user to send one follow-up message after 24-hour messaging window
 * have ended. The user will be offered to receive a future notification. Once
 * the user asks to be notified, the page will receive a token which is an
 * equivalent to a permission to send a single message to the user. The token
 * can only be used once and will expire within 1 year of creation.
 * @category Component
 * @props {@link RequestOneTimeNotifProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/one-time-notification).
 */
export const RequestOneTimeNotif: MessengerComponent<
  RequestOneTimeNotifProps,
  UnitSegment<MessageValue>
> = makeFacebookComponent(function RequestOneTimeNotif(node, path) {
  const { title, payload } = node.props;
  return [
    makeUnitSegment(node, path, {
      apiPath: PATH_MESSAGES,
      params: {
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'one_time_notif_req',
              title,
              payload,
            },
          },
        },
      },
    }),
  ];
});
