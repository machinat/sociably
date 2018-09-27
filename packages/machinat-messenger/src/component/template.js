import { ENTRY_MESSAGES } from './constant';
import {
  annotateNative,
  annotateNativeRoot,
  getValue,
  renderTextContent,
  renderQuickReplies,
} from './utils';

const CHILDREN = '.children';

const renderDefaultAction = (actionProp, render) => {
  const renderedAction = render(actionProp, '.defaultAction');
  if (renderedAction === undefined) {
    return undefined;
  }

  if (__DEV__) {
    // TODO: validate renderedAction
  }

  if (renderedAction[0].element === undefined) {
    return renderedAction[0].value;
  }

  const { title, ...action } = renderedAction[0].value;
  return action;
};

const renderButtons = (nodes, render, propName) => {
  const renderedButtons = render(nodes, propName);

  if (__DEV__) {
    // TODO: validate renderedButtons
  }

  return renderedButtons && renderedButtons.map(getValue);
};

export const GenericItem = (
  { children, title, imageUrl, subtitle, defaultAction },
  render
) => ({
  title,
  image_url: imageUrl,
  subtitle,
  default_action: renderDefaultAction(defaultAction, render),
  buttons: renderButtons(children, render, CHILDREN),
});
annotateNative(GenericItem);

export const GenericTemplate = (
  { children, sharable, quickReplies, imageAspectRatio },
  render
) => {
  const renderedItems = render(children, CHILDREN);

  if (__DEV__) {
    // TODO: validate renderedItems
  }

  return {
    message: {
      quick_replies: renderQuickReplies(quickReplies, render),
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          sharable,
          image_aspect_ratio: imageAspectRatio,
          elements: renderedItems.map(getValue),
        },
      },
    },
  };
};
annotateNativeRoot(GenericTemplate, ENTRY_MESSAGES);

export const ListTemplate = (
  { children, topStyle, sharable, quickReplies, button },
  render
) => {
  const itemsResult = render(children, CHILDREN);

  if (__DEV__) {
    // TODO: validate itemsResult
  }

  return {
    message: {
      quick_replies: renderQuickReplies(quickReplies, render),
      attachment: {
        type: 'template',
        payload: {
          template_type: 'list',
          top_element_style: topStyle,
          sharable,
          elements: itemsResult.map(getValue),
          buttons: renderButtons(button, render, '.button'),
        },
      },
    },
  };
};
annotateNativeRoot(ListTemplate, ENTRY_MESSAGES);

export const ButtonTemplate = (
  { children, text, sharable, quickReplies },
  render
) => ({
  message: {
    quick_replies: renderQuickReplies(quickReplies, render),
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: renderTextContent(text, render, '.text'),
        sharable,
        buttons: renderButtons(children, render, CHILDREN),
      },
    },
  },
});
annotateNativeRoot(ButtonTemplate, ENTRY_MESSAGES);

export const MediaTemplate = (
  { children, type, attachmentId, url, sharable, quickReplies },
  render
) => ({
  message: {
    quick_replies: renderQuickReplies(quickReplies, render),
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
            buttons: renderButtons(children, render, CHILDREN),
          },
        ],
      },
    },
  },
});
annotateNativeRoot(MediaTemplate, ENTRY_MESSAGES);

export const OpenGraphTemplate = (
  { children, url, sharable, quickReplies },
  render
) => ({
  message: {
    quick_replies: renderQuickReplies(quickReplies, render),
    attachment: {
      type: 'template',
      payload: {
        template_type: 'open_graph',
        sharable,
        elements: [
          {
            url,
            buttons: renderButtons(children, render, CHILDREN),
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
    quickReplies,
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
  const renderedItem = render(children, CHILDREN);

  if (__DEV__) {
    // TODO: validate renderedItem
  }

  return {
    message: {
      quick_replies: renderQuickReplies(quickReplies, render),
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
          elements: renderedItem.map(getValue),
        },
      },
    },
  };
};
annotateNativeRoot(ReceiptTemplate, ENTRY_MESSAGES);
