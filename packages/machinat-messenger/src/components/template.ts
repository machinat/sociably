import formatNode from '@machinat/core/utils/formatNode';
import { unitSegment, partSegment } from '@machinat/core/renderer';
import { annotateMessengerComponent } from '../utils';

export const GenericItem = async (node, path, render) => {
  const {
    buttons,
    title,
    imageURL,
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
    const { title: _, ...restOfURLButton } = defaultActionSegments[0].value;
    defaultAction = restOfURLButton;
  }

  return [
    partSegment(node, path, {
      title,
      image_url: imageURL,
      subtitle,
      default_action: defaultAction,
      buttons: buttonValues,
    }),
  ];
};
annotateMessengerComponent(GenericItem);

export const GenericTemplate = async (node, path, render) => {
  const { children, sharable, imageAspectRatio } = node.props;
  const elementsSegments = await render(children, '.children');
  const elementValues = elementsSegments?.map((segment) => segment.value);

  return [
    unitSegment(node, path, {
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
    }),
  ];
};
annotateMessengerComponent(GenericTemplate);

export const ButtonTemplate = async (node, path, render) => {
  const { children, buttons, sharable } = node.props;
  const textSegments = await render(children, '.children');
  let text = '';

  if (textSegments) {
    for (const segment of textSegments) {
      if (segment.type !== 'text') {
        throw new TypeError(
          `non-textual node ${formatNode(
            segment.node
          )} received, only textual nodes allowed`
        );
      }
    }

    text = textSegments[0].value;
  }

  const buttonSegments = await render(buttons, '.buttons');
  const buttonValues = buttonSegments?.map((segment) => segment.value);

  return [
    unitSegment(node, path, {
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text,
            sharable,
            buttons: buttonValues,
          },
        },
      },
    }),
  ];
};
annotateMessengerComponent(ButtonTemplate);

export const MediaTemplate = async (node, path, render) => {
  const { buttons, type, attachmentId, url, sharable } = node.props;
  const buttonSegments = await render(buttons, '.buttons');
  const buttonValues = buttonSegments?.map((segment) => segment.value);

  return [
    unitSegment(node, path, {
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'media',
            sharable,
            elements: [
              {
                media_type: type,
                url,
                attachment_id: attachmentId,
                buttons: buttonValues,
              },
            ],
          },
        },
      },
    }),
  ];
};
annotateMessengerComponent(MediaTemplate);

export const OpenGraphTemplate = async (node, path, render) => {
  const { buttons, url, sharable } = node.props;
  const buttonSegments = await render(buttons, '.buttons');
  const buttonValues = buttonSegments?.map((segment) => segment.value);

  return [
    unitSegment(node, path, {
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'open_graph',
            sharable,
            elements: [
              {
                url,
                buttons: buttonValues,
              },
            ],
          },
        },
      },
    }),
  ];
};
annotateMessengerComponent(OpenGraphTemplate);

export const ReceiptItem = async (node, path) => {
  const { title, subtitle, quantity, price, currency, imageURL } = node.props;
  return [
    partSegment(node, path, {
      title,
      subtitle,
      quantity,
      price,
      currency,
      image_url: imageURL,
    }),
  ];
};
annotateMessengerComponent(ReceiptItem);

export const ReceiptTemplate = async (node, path, render) => {
  const {
    children,
    sharable,
    recipientName,
    merchantName,
    orderNumber,
    currency,
    paymentMethod,
    orderURL,
    timestamp,
    address,
    summary,
    adjustments,
  } = node.props;

  const elementSegments = await render(children, '.children');
  const elementValues = elementSegments?.map((segment) => segment.value);

  return [
    unitSegment(node, path, {
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
            order_url: orderURL,
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
    }),
  ];
};
annotateMessengerComponent(ReceiptTemplate);
