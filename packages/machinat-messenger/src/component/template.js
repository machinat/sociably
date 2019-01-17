import invariant from 'invariant';
import {
  annotate,
  asNative,
  asUnit,
  hasEntry,
  joinTextValues,
  valuesOfAssertedType,
} from 'machinat-utility';

import * as buttonModule from './button';

import { MESSENGER_NAITVE_TYPE } from '../symbol';
import { ENTRY_MESSAGES } from '../apiEntry';

const buttonComponents = Object.values(buttonModule);

const CHILDREN = '.children';

const renderUrlButtonValues = valuesOfAssertedType(buttonModule.URLButton);
const renderButtonValues = valuesOfAssertedType(...buttonComponents);

export const GenericItem = (
  { children, title, imageURL, subtitle, defaultAction: defaultActionProp },
  render
) => {
  const urlButtonValues = renderUrlButtonValues(
    defaultActionProp,
    render,
    '.defaultAction'
  );

  // ignore title field
  let defaultAction;
  if (urlButtonValues) {
    const [{ title: _, ...defaultActionValue }] = urlButtonValues;
    defaultAction = defaultActionValue;
  }

  return [
    {
      title,
      image_url: imageURL,
      subtitle,
      default_action: defaultAction,
      buttons: renderButtonValues(children, render, CHILDREN),
    },
  ];
};

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(false))(GenericItem);

const renderGenericItemValues = valuesOfAssertedType(GenericItem);

export const GenericTemplate = (
  { children, sharable, imageAspectRatio },
  render
) => [
  {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          sharable,
          image_aspect_ratio: imageAspectRatio,
          elements: renderGenericItemValues(children, render, CHILDREN),
        },
      },
    },
  },
];

annotate(
  asNative(MESSENGER_NAITVE_TYPE),
  hasEntry(ENTRY_MESSAGES),
  asUnit(true)
)(GenericTemplate);

export const ListTemplate = (
  { children, topStyle, sharable, button },
  render
) => [
  {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'list',
          top_element_style: topStyle,
          sharable,
          elements: renderGenericItemValues(children, render, CHILDREN),
          buttons: renderButtonValues(button, render, '.button'),
        },
      },
    },
  },
];

annotate(
  asNative(MESSENGER_NAITVE_TYPE),
  hasEntry(ENTRY_MESSAGES),
  asUnit(true)
)(ListTemplate);

export const ButtonTemplate = ({ children, text, sharable }, render) => {
  const values = joinTextValues(text, render, '.text');

  let textValue;
  invariant(
    values !== undefined &&
      values.length === 1 &&
      typeof (textValue = values[0]) === 'string', // eslint-disable-line prefer-destructuring
    values
      ? `<br /> in prop "text" of <ButtonTemplate /> is invalid`
      : `prop "text" of <ButtonTemplate /> should not be empty`
  );

  return [
    {
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: textValue,
            sharable,
            buttons: renderButtonValues(children, render, CHILDREN),
          },
        },
      },
    },
  ];
};

annotate(
  asNative(MESSENGER_NAITVE_TYPE),
  hasEntry(ENTRY_MESSAGES),
  asUnit(true)
)(ButtonTemplate);

export const MediaTemplate = (
  { children, type, attachmentId, url, sharable },
  render
) => [
  {
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
              buttons: renderButtonValues(children, render, CHILDREN),
            },
          ],
        },
      },
    },
  },
];

annotate(
  asNative(MESSENGER_NAITVE_TYPE),
  hasEntry(ENTRY_MESSAGES),
  asUnit(true)
)(MediaTemplate);

export const OpenGraphTemplate = ({ children, url, sharable }, render) => [
  {
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'open_graph',
          sharable,
          elements: [
            {
              url,
              buttons: renderButtonValues(children, render, CHILDREN),
            },
          ],
        },
      },
    },
  },
];

annotate(
  asNative(MESSENGER_NAITVE_TYPE),
  hasEntry(ENTRY_MESSAGES),
  asUnit(true)
)(OpenGraphTemplate);

export const ReceiptItem = ({
  title,
  subtitle,
  quantity,
  price,
  currency,
  imageURL,
}) => [
  {
    title,
    subtitle,
    quantity,
    price,
    currency,
    image_url: imageURL,
  },
];

annotate(asNative(MESSENGER_NAITVE_TYPE), asUnit(false))(ReceiptItem);

const receiptTemplateItemValues = valuesOfAssertedType(ReceiptItem);

export const ReceiptTemplate = (
  {
    children,
    sharable,
    recipientName,
    orderNumber,
    currency,
    paymentMethod,
    orderURL,
    timestamp,
    address,
    summary,
    adjustments,
  },
  render
) => [
  {
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
          order_url: orderURL,
          timestamp:
            timestamp instanceof Date
              ? `${Math.floor(timestamp.getTime() / 1000)}`
              : timestamp,
          address,
          summary,
          adjustments,
          elements: receiptTemplateItemValues(children, render, CHILDREN),
        },
      },
    },
  },
];

annotate(
  asNative(MESSENGER_NAITVE_TYPE),
  hasEntry(ENTRY_MESSAGES),
  asUnit(true)
)(ReceiptTemplate);
