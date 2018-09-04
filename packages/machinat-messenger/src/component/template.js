import { Utils } from 'machinat-shared';
import { ENTRY_MESSAGES } from './constant';
import {
  annotateNative,
  annotateNativeRoot,
  renderOnlyType,
  renderOnlyInTypes,
  getRendered,
  renderTextContent,
} from './utils';
import * as buttonComponents from './button';

const { isElement } = Utils;

const CHILDREN = 'children';

const refineDefaultAction = (actionProp, render) => {
  if (!isElement(actionProp)) {
    return actionProp;
  }

  const actionResult = renderOnlyType(
    buttonComponents.URLButton,
    actionProp,
    render,
    'defaultAction'
  );

  const { title, ...action } = actionResult[0].rendered;
  return action;
};

const buttonTypes = Object.values(buttonComponents);
const refineButtons = (children, render, propName) => {
  const buttonsResult = renderOnlyInTypes(
    buttonTypes,
    children,
    render,
    propName
  );

  return buttonsResult && buttonsResult.map(getRendered);
};

export const GenericItem = (
  { children, title, imageUrl, subtitle, defaultAction },
  render
) => ({
  title,
  image_url: imageUrl,
  subtitle,
  default_action: refineDefaultAction(defaultAction, render),
  buttons: refineButtons(children, render, CHILDREN),
});
annotateNative(GenericItem);

export const GenericTemplate = (
  { children, sharable, imageAspectRatio },
  render
) => {
  const itemsResult = renderOnlyType(GenericItem, children, render, CHILDREN);

  // TODO: invariant itemsResult.length > 0 ?

  return {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          sharable,
          image_aspect_ratio: imageAspectRatio,
          elements: itemsResult.map(getRendered),
        },
      },
    },
  };
};
annotateNativeRoot(GenericTemplate, ENTRY_MESSAGES);

export const ListTemplate = (
  { children, topStyle, sharable, button },
  render
) => {
  const itemsResult = renderOnlyType(GenericItem, children, render, CHILDREN);

  // TODO: invariant itemsResult.length > 0 ?

  return {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'list',
          top_element_style: topStyle,
          sharable,
          elements: itemsResult.map(getRendered),
          buttons: refineButtons(button, render, 'button'),
        },
      },
    },
  };
};
annotateNativeRoot(ListTemplate, ENTRY_MESSAGES);

export const ButtonTemplate = ({ children, text, sharable }, render) => ({
  message: {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: renderTextContent(text, render, 'text'),
        sharable,
        buttons: refineButtons(children, render, CHILDREN),
      },
    },
  },
});
annotateNativeRoot(ButtonTemplate, ENTRY_MESSAGES);

export const MediaTemplate = (
  { children, type, attachmentId, url, sharable },
  render
) => ({
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
            buttons: refineButtons(children, render, CHILDREN),
          },
        ],
      },
    },
  },
});
annotateNativeRoot(MediaTemplate, ENTRY_MESSAGES);

export const OpenGraphTemplate = ({ children, url, sharable }, render) => ({
  message: {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'open_graph',
        sharable,
        elements: [
          {
            url,
            buttons: refineButtons(children, render, CHILDREN),
          },
        ],
      },
    },
  },
});
annotateNativeRoot(OpenGraphTemplate, ENTRY_MESSAGES);

export const ReceiptTemplateItem = ({
  title,
  subtitle,
  quantity,
  price,
  currency,
  imageUrl,
}) => ({
  title,
  subtitle,
  quantity,
  price,
  currency,
  image_url: imageUrl,
});
annotateNative(ReceiptTemplateItem);

export const ReceiptTemplate = (
  {
    children,
    sharable,
    recipientName,
    orderNumber,
    currency,
    paymentMethod,
    orderUrl,
    timestamp,
    address,
    summary,
    adjustments,
  },
  render
) => {
  const itemsResult = renderOnlyType(
    ReceiptTemplateItem,
    children,
    render,
    CHILDREN
  );

  // TODO: invariant itemsResult.length > 0 ?

  return {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'receipt',
          sharable,
          recipient_name: recipientName,
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
          elements: itemsResult.map(getRendered),
        },
      },
    },
  };
};
annotateNativeRoot(ReceiptTemplate, ENTRY_MESSAGES);
